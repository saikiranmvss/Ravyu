import type { Industry } from "./feature-flags";

export type InsightRecord = {
  entityName: string | null;
  aspect: string;
  sentiment: "positive" | "neutral" | "negative";
  reason: string;
  confidence: number;
  severity: "low" | "medium" | "high";
};

type Rule = {
  aspect: string;
  terms: string[];
  entities?: string[];
};

const POSITIVE_HINTS = ["great", "good", "excellent", "amazing", "love", "clean", "friendly", "best", "fast", "helpful"];
const NEGATIVE_HINTS = ["bad", "worst", "slow", "late", "dirty", "rude", "expensive", "oily", "cold", "issue", "complaint", "delay"];

const INDUSTRY_RULES: Record<Industry, Rule[]> = {
  restaurant: [
    { aspect: "taste", terms: ["taste", "flavor", "spicy", "bland", "oily"], entities: ["biryani", "pizza", "burger", "pasta", "noodles", "dosa"] },
    { aspect: "quantity", terms: ["portion", "quantity", "small", "enough"] },
    { aspect: "price", terms: ["price", "cost", "expensive", "value"] },
    { aspect: "hygiene", terms: ["clean", "hygiene", "dirty"] },
    { aspect: "delivery", terms: ["delivery", "late", "packaging", "cold"] },
  ],
  healthcare: [
    { aspect: "consultation", terms: ["doctor", "consultation", "diagnosis", "treatment"] },
    { aspect: "waiting_time", terms: ["wait", "queue", "delay", "late"] },
    { aspect: "staff_behavior", terms: ["staff", "nurse", "reception", "behavior", "rude", "polite"] },
    { aspect: "cleanliness", terms: ["clean", "hygiene", "sanitized", "dirty"] },
    { aspect: "billing", terms: ["bill", "billing", "charge", "cost"] },
  ],
  hospitality: [
    { aspect: "rooms", terms: ["room", "bed", "sleep", "linen"] },
    { aspect: "housekeeping", terms: ["housekeeping", "clean", "dirty", "towel"] },
    { aspect: "food", terms: ["breakfast", "food", "buffet", "restaurant"] },
    { aspect: "front_desk", terms: ["check-in", "check out", "front desk", "reception"] },
    { aspect: "amenities", terms: ["pool", "wifi", "gym", "spa", "amenities"] },
  ],
  travel: [
    { aspect: "package", terms: ["package", "itinerary", "trip", "tour"] },
    { aspect: "guide", terms: ["guide", "knowledge", "communication"] },
    { aspect: "transport", terms: ["bus", "transport", "pickup", "drop"] },
    { aspect: "timing", terms: ["delay", "on time", "schedule"] },
    { aspect: "experience", terms: ["experience", "activity", "fun", "boring"] },
  ],
  other: [{ aspect: "general", terms: ["service", "quality", "experience"] }],
};

function detectSentiment(text: string): "positive" | "neutral" | "negative" {
  const lower = text.toLowerCase();
  const pos = POSITIVE_HINTS.some((h) => lower.includes(h));
  const neg = NEGATIVE_HINTS.some((h) => lower.includes(h));
  if (pos && !neg) return "positive";
  if (neg && !pos) return "negative";
  return "neutral";
}

function detectSeverity(sentiment: "positive" | "neutral" | "negative", text: string): "low" | "medium" | "high" {
  if (sentiment !== "negative") return "low";
  if (/(unsafe|legal|infection|poison|fraud|danger)/i.test(text)) return "high";
  return "medium";
}

export function extractInsightsFromReview(reviewText: string, industry: Industry): InsightRecord[] {
  const lower = reviewText.toLowerCase();
  const sentiment = detectSentiment(reviewText);
  const severity = detectSeverity(sentiment, reviewText);
  const rules = INDUSTRY_RULES[industry];
  const matches: InsightRecord[] = [];

  for (const rule of rules) {
    const hasAspectMatch = rule.terms.some((term) => lower.includes(term));
    if (!hasAspectMatch) continue;
    const entity = rule.entities?.find((e) => lower.includes(e)) ?? null;
    matches.push({
      entityName: entity,
      aspect: rule.aspect,
      sentiment,
      reason: `Review mentioned ${rule.aspect}${entity ? ` (${entity})` : ""}.`,
      confidence: sentiment === "neutral" ? 0.65 : 0.82,
      severity,
    });
  }

  if (matches.length === 0) {
    matches.push({
      entityName: null,
      aspect: "general",
      sentiment,
      reason: "General sentiment from review text.",
      confidence: 0.6,
      severity,
    });
  }

  return matches;
}

export function buildActionSuggestions(insights: InsightRecord[], industry: Industry): string[] {
  const negatives = insights.filter((i) => i.sentiment === "negative");
  if (negatives.length === 0) {
    return [
      "Customer sentiment is stable this period; reinforce your strongest experiences in public replies.",
      "Promote your top-praised strengths in social posts and review request campaigns.",
    ];
  }

  const top = negatives.slice(0, 3);
  const suggestions = top.map((n) => {
    if (industry === "restaurant") {
      return `Customers flagged ${n.aspect}${n.entityName ? ` for ${n.entityName}` : ""}; review prep SOP and service checks this week.`;
    }
    if (industry === "healthcare") {
      return `Address ${n.aspect} complaints with an immediate process review and staff briefing.`;
    }
    if (industry === "hospitality") {
      return `Investigate ${n.aspect} issues and assign an owner for 7-day quality follow-up.`;
    }
    if (industry === "travel") {
      return `Audit ${n.aspect} touchpoints and proactively update upcoming customers before departure.`;
    }
    return `Prioritize fixes around ${n.aspect} based on recent negative patterns.`;
  });

  return suggestions;
}
