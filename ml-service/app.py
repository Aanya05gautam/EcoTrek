import io
import json
import os
import zipfile
from pathlib import Path

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.models import load_model
from tensorflow.keras.utils import register_keras_serializable


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "Updated_Ml_Model_from_scratch.keras"))
LABELS_PATH = Path(os.getenv("LABELS_PATH", BASE_DIR / "labels.json"))
IMAGE_SIZE = tuple(
    int(x.strip()) for x in os.getenv("IMAGE_SIZE", "224,224").split(",") if x.strip()
)

if len(IMAGE_SIZE) != 2:
    raise ValueError("IMAGE_SIZE must contain exactly two comma-separated integers")


@register_keras_serializable()
class CrossAttentionFusion(layers.Layer):
    def __init__(self, embed_dim=256, **kwargs):
        super().__init__(**kwargs)
        self.embed_dim = embed_dim
        self.cnn_proj = layers.Conv2D(embed_dim, kernel_size=1)
        self.query = layers.Dense(embed_dim)
        self.key = layers.Dense(embed_dim)
        self.value = layers.Dense(embed_dim)

    def call(self, inputs):
        projected = self.cnn_proj(inputs)
        shape = keras.ops.shape(projected)
        sequence = keras.ops.reshape(projected, (shape[0], -1, self.embed_dim))
        query = self.query(sequence)
        key = self.key(sequence)
        value = self.value(sequence)
        scores = keras.ops.matmul(query, keras.ops.transpose(key, (0, 2, 1)))
        scores = scores / keras.ops.sqrt(keras.ops.cast(self.embed_dim, scores.dtype))
        attention = keras.ops.softmax(scores, axis=-1)
        fused = keras.ops.matmul(attention, value)
        return keras.ops.mean(fused, axis=1)

    def get_config(self):
        return {**super().get_config(), "embed_dim": self.embed_dim}

app = FastAPI(title="EcoTrek ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
labels = ["Wet/Organic", "Dry/Recyclable", "Hazardous", "E-Waste"]


def load_labels() -> list[str]:
    if not LABELS_PATH.exists():
        return labels

    with LABELS_PATH.open("r", encoding="utf-8") as handle:
        loaded = json.load(handle)

    if isinstance(loaded, dict):
        loaded = loaded.get("labels", labels)

    if not isinstance(loaded, list) or not loaded:
        return labels

    return [str(item) for item in loaded]


def get_model():
    global model
    if model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        if not zipfile.is_zipfile(MODEL_PATH):
            raise RuntimeError(
                f"Model artifact is not a valid Keras .keras archive: {MODEL_PATH}. "
                "This file appears to be a notebook or text file, not model weights. "
                "Re-export the trained model using model.save('Updated_Ml_Model_from_scratch.keras') "
                "or save it as .h5 and update MODEL_PATH."
            )
        model = load_model(
            MODEL_PATH,
            custom_objects={"CrossAttentionFusion": CrossAttentionFusion},
            safe_mode=False,
        )
    return model


def preprocess_image(raw_bytes: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    image = image.resize(IMAGE_SIZE)
    # EfficientNetB0 includes its preprocessing layer and expects pixel values in the 0-255 range.
    array = np.asarray(image, dtype=np.float32)
    return np.expand_dims(array, axis=0)


def build_response(probabilities: np.ndarray) -> dict:
    class_labels = load_labels()
    top_index = int(np.argmax(probabilities))
    confidence = float(probabilities[top_index])
    category = class_labels[top_index] if top_index < len(class_labels) else "Other"

    guidance_map = {
        "Hazardous": "Handle separately and use an authorized hazardous waste facility.",
        "Non-Recyclable": "Keep it separate from recyclable material and follow your local waste-disposal guidance.",
        "Organic": "Place it in the wet/organic stream and avoid plastic contamination.",
        "Recyclable": "Keep it clean and dry before sending it to recycling.",
    }
    action_map = {
        "Hazardous": "Request an authorized municipal pickup or take it to a certified hazardous-waste facility.",
        "Non-Recyclable": "Request formal disposal so it does not enter the recyclable or organic stream.",
        "Organic": "Compost it at home or place it in the wet/organic collection stream.",
        "Recyclable": "Clean and dry it, then place it in the recyclable collection stream.",
    }

    return {
        "category": category,
        "confidence": round(confidence * 100, 2),
        "guidance": guidance_map.get(category, "Review the item and dispose of it using the appropriate waste stream."),
        "action": action_map.get(category, "Use the appropriate local waste stream."),
        "requiresPickup": category in {"Hazardous", "Non-Recyclable"},
        "note": f"Predicted by the Keras model with {round(confidence * 100, 2)}% confidence.",
    }


@app.get("/health")
def health():
    return {"ok": True, "service": "EcoTrek ML Service"}


@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload a valid image file.")

    try:
        raw_bytes = await image.read()
        batch = preprocess_image(raw_bytes)
        predictions = get_model().predict(batch, verbose=0)
        if isinstance(predictions, dict):
            predictions = predictions["household_category"]
        probabilities = np.asarray(predictions)[0]
        return build_response(probabilities)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc