import io
import json
import os
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from math import radians, sin, cos, asin, sqrt

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from tensorflow import keras


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = Path(
    os.getenv(
        "MODEL_PATH",
        BASE_DIR / "models" / "ecotrek_household_model.keras"
    )
)
OUTDOOR_MODEL_PATH = Path(
    os.getenv(
        "OUTDOOR_MODEL_PATH",
        BASE_DIR / "models" / "ecotrek_outdoor_best.keras"
    )
)

OUTDOOR_LABELS = [
    "normal",
    "overflowing",
    "scattered"
]

LABELS_PATH = Path(
    os.getenv(
        "LABELS_PATH",
        BASE_DIR / "labels.json"
    )
)

IMAGE_SIZE = (224, 224)


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="EcoTrek ML Service",
    version="3.0.0"
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ============================================================
# MODEL
# ============================================================

model = None


# ============================================================
# 7-CLASS HOUSEHOLD LABELS
# ============================================================

DEFAULT_LABELS = [
    "cardboard",
    "glass",
    "metal",
    "paper",
    "plastic",
    "organic",
    "trash"
]


def load_labels():

    # For this model, we use the fixed order from training.
    return DEFAULT_LABELS


# ============================================================
# LOAD MODEL
# ============================================================

def get_model():

    global model

    if model is None:

        if not MODEL_PATH.exists():

            raise FileNotFoundError(
                f"Model not found: {MODEL_PATH}"
            )

        print(
            f"Loading model from: {MODEL_PATH}"
        )

        model = keras.models.load_model(
            MODEL_PATH,
            compile=False
        )

        print(
            "EcoTrek 7-class household model "
            "loaded successfully."
        )

    return model

# ============================================================
# ECOTREK ROUTE OPTIMIZATION MODEL
# ============================================================

ROUTE_MODEL_PATH = Path(
    os.getenv(
        "ROUTE_MODEL_PATH",
        BASE_DIR / "models" / "ecotrek_route_utility_model.joblib"
    )
)

route_model = joblib.load(ROUTE_MODEL_PATH)

print(f"✅ Route utility model loaded: {ROUTE_MODEL_PATH}")


# Feature mappings used during training
SEVERITY = {
    "Low": 1,
    "Medium": 2,
    "High": 3,
    "Critical": 4,
}

QUANTITY = {
    "Low": 1,
    "Medium": 2,
    "High": 3,
}

DENSITY = {
    "Low": 1,
    "Medium": 2,
    "High": 3,
}

HAZARD = {
    "None": 0,
    "Possible": 0.5,
    "Confirmed": 1,
}

ROUTE_FEATURES = [
    "severity_num",
    "quantity_num",
    "density_num",
    "hazard_num",
    "report_count",
    "age_hours",
    "volume_kg",
    "toxicity",
    "priority_score",
    "distance_km",
]


def haversine_distance_km(point1, point2):
    lat1, lon1 = map(radians, point1)
    lat2, lon2 = map(radians, point2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    )

    return 6371.0 * 2 * asin(sqrt(min(1, a)))


def prepare_route_features(reports, depot):
    df = pd.DataFrame(reports)

    if df.empty:
        return df

    df["severity_num"] = (
        df.get("severity", "Medium")
        .map(SEVERITY)
        .fillna(2)
    )

    df["quantity_num"] = (
        df.get("quantity", "Medium")
        .map(QUANTITY)
        .fillna(2)
    )

    df["density_num"] = (
        df.get("density", "Medium")
        .map(DENSITY)
        .fillna(2)
    )

    df["hazard_num"] = (
        df.get("hazard", "None")
        .map(HAZARD)
        .fillna(0)
    )

    df["report_count"] = pd.to_numeric(
        df.get("report_count", 1),
        errors="coerce"
    ).fillna(1)

    df["age_hours"] = pd.to_numeric(
        df.get("age_hours", 0),
        errors="coerce"
    ).fillna(0)

    df["volume_kg"] = pd.to_numeric(
        df.get("volume_kg", 10),
        errors="coerce"
    ).fillna(10)

    df["toxicity"] = pd.to_numeric(
        df.get("toxicity", 0),
        errors="coerce"
    ).fillna(0)

    df["priority_score"] = pd.to_numeric(
        df.get("priority_score", 0.5),
        errors="coerce"
    ).fillna(0.5)

    df["lat"] = pd.to_numeric(df["lat"], errors="coerce")
    df["lng"] = pd.to_numeric(df["lng"], errors="coerce")

    df = df.dropna(subset=["lat", "lng"]).copy()

    df["distance_km"] = df.apply(
        lambda row: haversine_distance_km(
            depot,
            [row["lat"], row["lng"]]
        ),
        axis=1,
    )

    return df


def generate_ml_route(
    reports,
    depot,
    vehicle_capacity_kg=100
):
    df = prepare_route_features(reports, depot)

    if df.empty:
        return {
            "route": [],
            "total_distance_km": 0,
            "collected_kg": 0,
            "nodes_collected": 0,
            "capacity_used_kg": 0,
            "remaining_capacity_kg": vehicle_capacity_kg,
        }

    # Predict utility for every collection point
    df["ml_utility"] = np.clip(
        route_model.predict(df[ROUTE_FEATURES]),
        0,
        1,
    )

    current_point = np.array(depot, dtype=float)
    remaining_capacity = float(vehicle_capacity_kg)

    remaining = df.copy()
    selected = []

    total_distance = 0.0
    collected_kg = 0.0

    # Greedy capacity-aware route construction
    while not remaining.empty:

        candidates = []

        for idx, row in remaining.iterrows():

            waste = float(row["volume_kg"])

            if waste > remaining_capacity:
                continue

            point = np.array(
                [row["lat"], row["lng"]],
                dtype=float
            )

            distance = haversine_distance_km(
                current_point,
                point
            )

            travel_efficiency = 1 / (1 + distance)

            route_score = (
                0.75 * float(row["ml_utility"])
                + 0.25 * travel_efficiency
            )

            candidates.append({
                "index": idx,
                "distance": distance,
                "route_score": route_score,
            })

        if not candidates:
            break

        best = max(
            candidates,
            key=lambda x: x["route_score"]
        )

        idx = best["index"]
        distance = best["distance"]

        row = remaining.loc[idx]

        selected.append(row)

        total_distance += distance

        collected_kg += float(row["volume_kg"])

        remaining_capacity -= float(row["volume_kg"])

        current_point = np.array(
            [row["lat"], row["lng"]],
            dtype=float
        )

        remaining = remaining.drop(index=idx)

    # Return to depot
    if selected:
        return_distance = haversine_distance_km(
            current_point,
            depot
        )

        total_distance += return_distance
    else:
        return_distance = 0.0

    route = []

    for sequence, row in enumerate(selected, start=1):

        route.append({
            "sequence": sequence,
            "reportId": str(row.get("id", "")),
            "latitude": float(row["lat"]),
            "longitude": float(row["lng"]),
            "wasteKg": round(float(row["volume_kg"]), 2),
            "priorityScore": round(
                float(row["priority_score"]),
                4
            ),
            "mlUtility": round(
                float(row["ml_utility"]),
                4
            ),
            "severity": str(row.get("severity", "Medium")),
            "quantity": str(row.get("quantity", "Medium")),
            "density": str(row.get("density", "Medium")),
            "hazard": str(row.get("hazard", "None")),
        })

    return {
        "route": route,
        "total_distance_km": round(total_distance, 3),
        "return_distance_km": round(return_distance, 3),
        "collected_kg": round(collected_kg, 3),
        "nodes_collected": len(route),
        "capacity_used_kg": round(collected_kg, 3),
        "remaining_capacity_kg": round(
            remaining_capacity,
            3
        ),
    }
# ============================================================
# OUTDOOR MODEL
# ============================================================

outdoor_model = None


def get_outdoor_model():

    global outdoor_model

    if outdoor_model is None:

        if not OUTDOOR_MODEL_PATH.exists():

            raise FileNotFoundError(
                f"Outdoor model not found: {OUTDOOR_MODEL_PATH}"
            )

        print(
            f"Loading outdoor model from: {OUTDOOR_MODEL_PATH}"
        )

        outdoor_model = keras.models.load_model(
            OUTDOOR_MODEL_PATH,
            compile=False
        )

        print(
            "EcoTrek outdoor model loaded successfully."
        )

    return outdoor_model

# ============================================================
# IMAGE PREPROCESSING
# ============================================================

def preprocess_image(raw_bytes: bytes):

    try:

        image = Image.open(
            io.BytesIO(raw_bytes)
        ).convert("RGB")

    except Exception as exc:

        raise ValueError(
            "Unable to read the uploaded image."
        ) from exc

    image = image.resize(
        IMAGE_SIZE
    )

    array = np.asarray(
        image,
        dtype=np.float32
    )

    array = np.expand_dims(
        array,
        axis=0
    )

    return array


# ============================================================
# WASTE CATEGORY MAP
# ============================================================

WASTE_STREAM_MAP = {

    "cardboard": "Recyclable",

    "glass": "Recyclable",

    "metal": "Recyclable",

    "paper": "Recyclable",

    "plastic": "Recyclable",

    "organic": "Organic",

    "trash": "Non-Recyclable"
}


# ============================================================
# GUIDANCE
# ============================================================

GUIDANCE_MAP = {
    "cardboard": "Flatten the cardboard and keep it clean and dry before recycling.",
    "glass": "Keep glass separate and place it in the appropriate glass recycling stream.",
    "metal": "Empty and rinse the metal container before placing it in recycling.",
    "paper": "Keep paper clean and dry and place it in the recyclable stream.",
    "plastic": "Empty, rinse and dry the plastic item before placing it in recycling.",
    "organic": "Organic waste can be converted into useful compost through home composting, garden composting, vermicomposting, or community composting.",
    "trash": "Place this item in the non-recyclable waste stream."
}


ACTION_MAP = {
    "cardboard": "Place clean cardboard in the recyclable collection stream.",
    "glass": "Place the glass item in the appropriate recyclable collection stream.",
    "metal": "Place the clean metal item in the recyclable collection stream.",
    "paper": "Place clean and dry paper in the recyclable collection stream.",
    "plastic": "Place clean and dry plastic in the recyclable collection stream.",
    "organic": "Choose a suitable composting method for the organic waste.",
    "trash": "Place the waste in the non-recyclable waste collection stream."
}

COMPOST_IDEAS = [
    {
        "title": "Home Composting",
        "description": "Combine fruit and vegetable scraps with dry leaves or shredded cardboard to create nutrient-rich compost."
    },
    {
        "title": "Garden Composting",
        "description": "Mix suitable kitchen waste with dry leaves, garden waste, and a small amount of soil."
    },
    {
        "title": "Small-Space Composting",
        "description": "Use a small ventilated composting container suitable for apartments or limited spaces."
    },
    {
        "title": "Vermicomposting",
        "description": "Use suitable organic kitchen waste with earthworms to produce nutrient-rich compost."
    },
    {
        "title": "Community Composting",
        "description": "Take suitable organic waste to a nearby community composting facility."
    }
]

# ============================================================
# RESPONSE BUILDER
# ============================================================

def build_response(probabilities):

    class_labels = load_labels()

    probabilities = np.asarray(
        probabilities,
        dtype=np.float32
    )

    # Safety check
    if len(class_labels) != len(probabilities):

        raise RuntimeError(
            f"Model returns {len(probabilities)} classes "
            f"but EcoTrek expects {len(class_labels)} labels."
        )

    # Get highest probability class
    predicted_index = int(
        np.argmax(probabilities)
    )

    material = class_labels[
        predicted_index
    ]

    confidence = float(
        probabilities[predicted_index]
    )

    category = WASTE_STREAM_MAP.get(
        material,
        "Other"
    )

    # All predictions
    all_predictions = []

    for label, probability in zip(
        class_labels,
        probabilities
    ):

        all_predictions.append({

            "material": label,

            "confidence": round(
                float(probability) * 100,
                2
            )
        })

    result = {

        "material": material,

        "category": category,

        "confidence": round(
            confidence * 100,
            2
        ),

        "guidance": GUIDANCE_MAP.get(
            material,
            "Use the appropriate local waste stream."
        ),

        "action": ACTION_MAP.get(
            material,
            "Use the appropriate local waste stream."
        ),

        "requiresPickup": False,

        "allPredictions": all_predictions,

        "note":
            "Prediction generated by the "
            "EcoTrek 7-class household "
            "EfficientNetB0 model."
    }

    # Add compost ideas only for organic waste
    if material == "organic":
        result["compostIdeas"] = COMPOST_IDEAS

    return result

# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {

        "ok": True,

        "service":
            "EcoTrek ML Service",

        "model":
            MODEL_PATH.name,

        "labels":
            load_labels()
    }


# ============================================================
# PREDICTION
# ============================================================

@app.post("/predict")
async def predict(
    image: UploadFile = File(...)
):

    if (
        not image.content_type
        or not image.content_type.startswith("image/")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    try:

        raw_bytes = await image.read()

        batch = preprocess_image(
            raw_bytes
        )

        loaded_model = get_model()

        predictions = loaded_model.predict(
            batch,
            verbose=0
        )

        probabilities = np.asarray(
            predictions
        )[0]

        return build_response(
            probabilities
        )

    except Exception as exc:

        print(
            "Prediction error:",
            repr(exc)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {exc}"
        ) from exc

# ============================================================
# OUTDOOR / PUBLIC WASTE PREDICTION
# ============================================================

@app.post("/predict-outdoor")
async def predict_outdoor(
    image: UploadFile = File(...)
):

    if (
        not image.content_type
        or not image.content_type.startswith("image/")
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    try:

        raw_bytes = await image.read()

        batch = preprocess_image(raw_bytes)

        loaded_model = get_outdoor_model()

        predictions = loaded_model.predict(
            batch,
            verbose=0
        )

        probabilities = np.asarray(predictions)[0]

        predicted_index = int(
            np.argmax(probabilities)
        )

        material = OUTDOOR_LABELS[predicted_index]

        confidence = float(
            probabilities[predicted_index]
        )

        all_predictions = []

        for label, probability in zip(
            OUTDOOR_LABELS,
            probabilities
        ):
            all_predictions.append({
                "material": label,
                "confidence": round(
                    float(probability) * 100,
                    2
                )
            })

        guidance_map = {
            "normal": "The area appears to have normal waste conditions.",
            "overflowing": "The waste container appears to be overflowing. Avoid adding more waste and report it for cleanup.",
            "scattered": "Waste appears to be scattered around the area. Report the location for cleanup."
        }

        action_map = {
            "normal": "No immediate cleanup action is required.",
            "overflowing": "Report the overflowing waste container to the responsible waste collection service.",
            "scattered": "Report the location so the scattered waste can be collected."
        }

        return {
            "material": material,
            "category": "Outdoor/Public",
            "confidence": round(
                confidence * 100,
                2
            ),
            "guidance": guidance_map[material],
            "action": action_map[material],
            "requiresPickup": material in [
                "overflowing",
                "scattered"
            ],
            "allPredictions": all_predictions,
            "note": "Prediction generated by the EcoTrek outdoor EfficientNetB0 model."
        }

    except Exception as exc:

        print(
            "Outdoor prediction error:",
            repr(exc)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Outdoor prediction failed: {exc}"
        ) from exc

@app.post("/predict-route")
async def predict_route(payload: dict):
    try:
        reports = payload.get("reports", [])

        depot = payload.get(
            "depot",
            [28.6139, 77.2090]
        )

        vehicle_capacity_kg = float(
            payload.get("vehicleCapacityKg", 100)
        )

        if not reports:
            return {
                "success": True,
                "message": "No reports available for routing.",
                "route": [],
                "total_distance_km": 0,
                "collected_kg": 0,
                "nodes_collected": 0,
            }

        result = generate_ml_route(
            reports=reports,
            depot=depot,
            vehicle_capacity_kg=vehicle_capacity_kg,
        )

        return {
            "success": True,
            "method": "EcoTrek-Learned",
            **result,
        }

    except Exception as e:
        print("❌ Route optimization error:", str(e))

        return {
            "success": False,
            "message": str(e),
        }    