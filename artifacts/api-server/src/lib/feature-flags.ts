export type Industry = "restaurant" | "healthcare" | "hospitality" | "travel" | "other";

export const featureFlags = {
  industryInsights: true,
  smartRepliesV2: true,
  weeklyReports: true,
  pricingSurfaces: true,
  medicalRiskAlerts: true,
  hospitalityDepartmentTrends: true,
  travelPrediction: true,
} as const;

export function normalizeIndustry(value: string | null | undefined): Industry {
  const v = (value ?? "").toLowerCase();
  if (v === "restaurant") return "restaurant";
  if (v === "healthcare") return "healthcare";
  if (v === "hospitality") return "hospitality";
  if (v === "travel") return "travel";
  return "other";
}
