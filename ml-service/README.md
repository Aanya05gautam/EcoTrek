# EcoTrek ML Service

FastAPI inference server for the Keras image-classification model trained in Google Colab.

## Files

- `Updated_Ml_Model_from_scratch.keras`: exported Keras model from Colab
- `labels.json`: class order used during training

## Expected response

```json
{
  "category": "Dry/Recyclable",
  "confidence": 92.5,
  "guidance": "Keep it clean and dry before sending it to recycling.",
  "note": "Predicted by the Keras model with 92.5% confidence."
}
```

## Run

```bash
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

## Environment variables

- `MODEL_PATH` optional path to the exported `.keras` model
- `LABELS_PATH` optional path to `labels.json`
- `IMAGE_SIZE` optional resize target, default `224,224`
- `CORS_ORIGIN` optional frontend origin, default `http://localhost:5173`

## Example `labels.json`

```json
{
  "labels": [
    "Wet/Organic",
    "Dry/Recyclable",
    "Hazardous",
    "E-Waste"
  ]
}
```