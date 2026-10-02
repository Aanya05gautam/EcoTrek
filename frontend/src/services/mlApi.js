const ML_API_URL = "http://127.0.0.1:8080";

export async function predictWaste(imageFile) {
  const formData = new FormData();

  formData.append("image", imageFile);

  const response = await fetch(
    `${ML_API_URL}/predict`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      error || "Waste prediction failed"
    );
  }

  return await response.json();
}

export async function predictOutdoorWaste(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch(`${ML_API_URL}/predict-outdoor`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Outdoor waste prediction failed");
  }

  return await response.json();
}