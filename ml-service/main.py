import io
import json
import os
from pathlib import Path

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from tensorflow import keras
from tensorflow.keras import layers


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = Path(
    os.getenv(
        "MODEL_PATH",
        BASE_DIR / "ecotrek_edf_net.keras"
    )
)

LABELS_PATH = Path(
    os.getenv(
        "LABELS_PATH",
        BASE_DIR / "labels.json"
    )
)

IMAGE_SIZE = (224, 224)


# ============================================================
# CROSS ATTENTION LAYER
# ============================================================

@keras.utils.register_keras_serializable()
class CrossAttentionFusion(layers.Layer):

    def __init__(self, embed_dim=256, **kwargs):
        super().__init__(**kwargs)

        self.embed_dim = embed_dim

        self.cnn_proj = layers.Conv2D(
            embed_dim,
            kernel_size=1
        )

        self.query = layers.Dense(embed_dim)
        self.key = layers.Dense(embed_dim)
        self.value = layers.Dense(embed_dim)

    def call(self, inputs):

        projected = self.cnn_proj(inputs)

        shape = keras.ops.shape(projected)

        sequence = keras.ops.reshape(
            projected,
            (
                shape[0],
                -1,
                self.embed_dim
            )
        )

        query = self.query(sequence)
        key = self.key(sequence)
        value = self.value(sequence)

        scores = keras.ops.matmul(
            query,
            keras.ops.transpose(
                key,
                (0, 2, 1)
            )
        )

        scores = scores / keras.ops.sqrt(
            keras.ops.cast(
                self.embed_dim,
                scores.dtype
            )
        )

        attention = keras.ops.softmax(
            scores,
            axis=-1
        )

        fused = keras.ops.matmul(
            attention,
            value
        )

        return keras.ops.mean(
            fused,
            axis=1
        )

    def get_config(self):

        config = super().get_config()

        config.update({
            "embed_dim": self.embed_dim
        })

        return config


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="EcoTrek ML Service",
    version="2.0.0"
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
# GLOBAL MODEL
# ============================================================

model = None


# ============================================================
# LOAD LABELS
# ============================================================

DEFAULT_LABELS = [
    "cardboard",
    "glass",
    "metal",
    "paper",
    "plastic"
]


def load_labels():

    if not LABELS_PATH.exists():
        return DEFAULT_LABELS

    with LABELS_PATH.open(
        "r",
        encoding="utf-8"
    ) as f:

        data = json.load(f)

    if isinstance(data, dict):

        data = data.get(
            "labels",
            DEFAULT_LABELS
        )

    if not isinstance(data, list):
        return DEFAULT_LABELS

    return [
        str(label)
        for label in data
    ]


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
            custom_objects={
                "CrossAttentionFusion":
                    CrossAttentionFusion
            },
            compile=False
        )

        print("EcoTrek model loaded successfully.")

    return model


# ============================================================
# IMAGE PREPROCESSING
# ============================================================

def preprocess_image(
    raw_bytes: bytes
):

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
# MATERIAL → ECOTREK CATEGORY
# ============================================================

WASTE_STREAM_MAP = {

    "cardboard": "Recyclable",

    "glass": "Recyclable",

    "metal": "Recyclable",

    "paper": "Recyclable",

    "plastic": "Recyclable"
}


GUIDANCE_MAP = {

    "cardboard":
        "Flatten the cardboard and keep it clean and dry before recycling.",

    "glass":
        "Keep glass separate and place it in the appropriate glass recycling stream.",

    "metal":
        "Empty and rinse the metal container before placing it in recycling.",

    "paper":
        "Keep paper clean and dry and place it in the recyclable stream.",

    "plastic":
        "Empty, rinse and dry the plastic item before placing it in recycling."
}


ACTION_MAP = {

    "cardboard":
        "Place clean cardboard in the recyclable collection stream.",

    "glass":
        "Place the glass item in the appropriate recyclable collection stream.",

    "metal":
        "Place the clean metal item in the recyclable collection stream.",

    "paper":
        "Place clean and dry paper in the recyclable collection stream.",

    "plastic":
        "Place clean and dry plastic in the recyclable collection stream."
}


# ============================================================
# RESPONSE BUILDER
# ============================================================

def build_response(
    probabilities
):

    class_labels = load_labels()

    probabilities = np.asarray(
        probabilities,
        dtype=np.float32
    )

    if len(class_labels) != len(probabilities):

        raise RuntimeError(
            f"Model returns {len(probabilities)} classes "
            f"but labels.json contains "
            f"{len(class_labels)} labels."
        )

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

    return {

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
            "Prediction generated by the trained "
            "EcoTrek EDF-Net model."
    }


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

        # Model has one output
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