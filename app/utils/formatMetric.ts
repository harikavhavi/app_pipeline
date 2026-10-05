export const formatMetric = (val: number | string | boolean | null, unit: string | null, decimals = 1): string => {
  if (val === null || val === undefined) return "--";
  if (typeof val !== "number") return String(val);
  return `${val.toFixed(decimals)}${unit ? " " + unit : ""}`;
};
export const formatScore = (score: number | null): string => score !== null ? String(Math.round(score)) : "--";
export const formatDelta = (delta: number | null, unit: string | null): string => {
  if (delta === null || delta === undefined) return "";
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}${unit ? " " + unit : ""}`;
};
