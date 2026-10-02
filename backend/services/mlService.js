import fs from 'fs/promises';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8080';

export async function classifyImage(
  filePath,
  fileName = "image.jpg",
  mimeType = "image/jpeg",
  endpoint = "/predict"
) {
  const rawBytes = await fs.readFile(filePath);

  const formData = new FormData();

  formData.append(
    "image",
    new Blob([rawBytes], { type: mimeType }),
    fileName
  );

  const response = await fetch(
    `${ML_SERVICE_URL.replace(/\/$/, "")}${endpoint}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "ML service request failed"
    );
  }

  return data;
}