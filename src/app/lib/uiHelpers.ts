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
