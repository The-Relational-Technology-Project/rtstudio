export interface ResizedImage {
  mediaType: "image/jpeg";
  base64: string;
  dataUrl: string;
}

/**
 * Resize an image file to at most maxWidth pixels wide, encode as JPEG,
 * and return both a base64 string (for API use) and a data URL (for preview).
 */
export async function resizeImageToBase64(
  file: File,
  maxWidth = 1000,
  quality = 0.8
): Promise<ResizedImage> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const targetW = Math.round(img.width * scale);
  const targetH = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
  const base64 = jpegDataUrl.split(",")[1] ?? "";

  return { mediaType: "image/jpeg", base64, dataUrl: jpegDataUrl };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("File read error"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load error"));
    img.src = src;
  });
}
