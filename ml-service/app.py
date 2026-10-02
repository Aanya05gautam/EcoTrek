import io
import json
import os
from pathlib import Path

import numpy as np
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