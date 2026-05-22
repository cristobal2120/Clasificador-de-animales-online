export function getConfidenceColor(conf: number): string {
  if (conf >= 85) return "#059669";
  if (conf >= 60) return "#D97706";
  return "#DC2626";
}

export function getConfidenceLabel(conf: number): string {
  if (conf >= 90) return "Muy alto";
  if (conf >= 75) return "Alto";
  if (conf >= 50) return "Moderado";
  return "Bajo";
}

export function getUserInitials(username: string, email: string): string {
  const fromName = username.trim().slice(0, 2);
  if (fromName.length >= 2) return fromName.toUpperCase();
  return (email.split("@")[0] ?? "U").slice(0, 2).toUpperCase();
}

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Solo se permiten archivos de imagen.";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Formato no soportado. Usa JPG, PNG, WEBP o GIF.";
  }
  if (file.size > MAX_IMAGE_BYTES) return "La imagen no debe superar 10 MB.";
  return null;
}
