import API_URL from "../config/api";

export async function convertImageWithFreeConvert(
  file: File,
  accessToken: string,
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  const formData = new FormData();
  formData.append("file", file, file.name);

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/api/admin/storage/convert-webp`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      },
    );
  } catch {
    console.warn(
      "Image conversion service is unreachable; uploading the original image.",
    );
    return file;
  }

  // Never hide failures from the admin authentication endpoint.
  if (response.status === 401 || response.status === 403) {
    let message = "Your admin session has expired. Please sign in again.";

    try {
      const result = await response.json();
      if (typeof result.detail === "string") {
        message = result.detail;
      }
    } catch {
      // Keep the safe authentication message.
    }

    throw new Error(message);
  }

  // Conversion is optional. Preserve the original if the service fails,
  // including when FreeConvert has exhausted its quota.
  if (!response.ok) {
    console.warn(
      `Image conversion returned HTTP ${response.status}; uploading the original image.`,
    );
    return file;
  }

  try {
    const blob = await response.blob();

    if (blob.type !== "image/webp" || blob.size === 0) {
      console.warn(
        "Image conversion returned an invalid WebP; uploading the original image.",
      );
      return file;
    }

    const baseName =
      file.name.replace(/\.[^.]+$/, "") || "image";

    return new File(
      [blob],
      `${baseName}.webp`,
      {
        type: "image/webp",
        lastModified: Date.now(),
      },
    );
  } catch {
    console.warn(
      "Could not read the converted image; uploading the original image.",
    );
    return file;
  }
}

export function getImageFileExtension(file: File): string {
  const match = file.name.match(/\.([^.]+)$/);
  const extension = match?.[1]?.toLowerCase();

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  const subtype = file.type.split("/")[1]?.split("+")[0];
  return subtype && /^[a-z0-9]+$/i.test(subtype)
    ? subtype.toLowerCase()
    : "img";
}
