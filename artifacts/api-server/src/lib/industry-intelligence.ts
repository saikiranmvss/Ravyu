import type { Industry } from "./feature-flags";
import type { AspectMomentumRow } from "./industry-report-metrics";

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

/** Expanded dish / item vocabulary for restaurant reviews (keyword extraction). */
export const RESTAURANT_DISH_LEXICON: string[] = [
  "biryani",
  "pulao",
  "fried rice",
  "rice",
  "naan",
  "roti",
  "paratha",
  "dosa",
  "idli",
  "vada",
  "sambar",
  "uttapam",
  "paneer",
  "tikka",
  "kebab",
  "curry",
  "dal",
  "thali",
  "chicken",
  "mutton",
  "fish",
  "prawns",
  "pizza",
  "pasta",
  "burger",
  "sandwich",
  "noodles",
  "momos",
  "rolls",
  "shawarma",
  "ramen",
  "sushi",
  "steak",
  "salad",
  "soup",
  "dessert",
  "ice cream",
  "cake",
  "coffee",
  "chai",
  "lassi",
  "starter",
  "appetizer",
  "buffet",
  "breakfast",
  "brunch",
];

const POSITIVE_HINTS = [
  "great",
  "good",
  "excellent",
  "amazing",
  "love",
  "clean",
  "friendly",
  "best",
  "fast",
  "helpful",
  "delicious",
  "tasty",
  "fresh",
];
const NEGATIVE_HINTS = [
  "bad",
  "worst",
  "slow",
  "late",
  "dirty",
  "rude",
  "expensive",
  "oily",
  "cold",
  "issue",
  "complaint",
  "delay",
  "stale",
  "undercooked",
];

const INDUSTRY_RULES: Record<Industry, Rule[]> = {
  restaurant: [
    {
      aspect: "taste",
      terms: ["taste", "flavor", "spicy", "bland", "oily", "delicious", "yummy", "yuck"],
      entities: RESTAURANT_DISH_LEXICON,
    },
    { aspect: "quantity", terms: ["portion", "quantity", "small", "enough", "serving"] },
    { aspect: "price", terms: ["price", "cost", "expensive", "cheap", "value", "overpriced"] },
    { aspect: "hygiene", terms: ["clean", "hygiene", "dirty", "sanitary"] },
    { aspect: "delivery", terms: ["delivery", "late", "packaging", "zomato", "swiggy"] },
  ],
  healthcare: [
    { aspect: "consultation", terms: ["doctor", "consultation", "diagnosis", "treatment", "dr."] },
    { aspect: "waiting_time", terms: ["wait", "queue", "delay", "late", "hours"] },
    { aspect: "staff_behavior", terms: ["staff", "nurse", "reception", "behavior", "rude", "polite"] },
    { aspect: "cleanliness", terms: ["clean", "hygiene", "sanitized", "dirty"] },
    { aspect: "billing", terms: ["bill", "billing", "charge", "cost", "insurance"] },
  ],
  hospitality: [
    { aspect: "rooms", terms: ["room", "bed", "sleep", "linen", "ac", "noise"] },
    { aspect: "housekeeping", terms: ["housekeeping", "clean", "dirty", "towel"] },
    { aspect: "food", terms: ["breakfast", "food", "buffet", "restaurant", "dining"] },
    { aspect: "front_desk", terms: ["check-in", "check out", "front desk", "reception"] },
    { aspect: "amenities", terms: ["pool", "wifi", "gym", "spa", "amenities", "parking"] },
  ],
  travel: [
    { aspect: "package", terms: ["package", "itinerary", "trip", "tour", "day trip"] },
    { aspect: "guide", terms: ["guide", "knowledge", "communication", "driver"] },
    { aspect: "transport", terms: ["bus", "transport", "pickup", "drop", "vehicle"] },
    { aspect: "timing", terms: ["delay", "on time", "schedule", "late"] },
    { aspect: "experience", terms: ["experience", "activity", "fun", "boring", "memorable"] },
  ],
  other: [{ aspect: "general", terms: ["service", "quality", "experience"] }],
};

export function detectSentiment(text: string): "positive" | "neutral" | "negative" {
  const lower = text.toLowerCase();
  const pos = POSITIVE_HINTS.some((h) => lower.includes(h));
  const neg = NEGATIVE_HINTS.some((h) => lower.includes(h));
  if (pos && !neg) return "positive";
  if (neg && !pos) return "negative";
  return "neutral";
}

function detectSeverity(sentiment: "positive" | "neutral" | "negative", text: string): "low" | "medium" | "high" {
  if (sentiment !== "negative") return "low";
  if (/(unsafe|legal|malpractice|infection|contamination|poison|fraud|negligen)/i.test(text)) return "high";
  return "medium";
}

function pickFoodEntities(lower: string): string[] {
  const found: string[] = [];
  for (const dish of RESTAURANT_DISH_LEXICON) {
    if (lower.includes(dish)) found.push(dish);
  }
  return [...new Set(found)].slice(0, 3);
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
    let entity: string | null = rule.entities?.find((e) => lower.includes(e)) ?? null;
    if (industry === "restaurant" && rule.aspect === "taste" && !entity) {
      const foods = pickFoodEntities(lower);
      entity = foods[0] ?? null;
    }
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
    if (industry === "restaurant") {
      const foods = pickFoodEntities(lower);
      if (foods.length > 0) {
        for (const f of foods.slice(0, 2)) {
          matches.push({
            entityName: f,
            aspect: "taste",
            sentiment,
            reason: `Review referenced ${f}.`,
            confidence: 0.68,
            severity,
          });
        }
      }
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
  }

  return matches;
}

export function buildActionSuggestions(insights: InsightRecord[], industry: Industry): string[] {
  return buildRichActionSuggestions(insights, industry, []);
}

export function buildRichActionSuggestions(
  insights: InsightRecord[],
  industry: Industry,
  aspectMomentum: AspectMomentumRow[],
): string[] {
  const negatives = insights.filter((i) => i.sentiment === "negative");
  const suggestions: string[] = [];

  for (const m of aspectMomentum) {
    if (m.changePercent === null || m.negativeCount === 0) continue;
    if (m.changePercent >= 15) {
      suggestions.push(
        `${humanAspect(m.aspect)} complaints rose ~${m.changePercent}% vs the prior period — assign an owner and confirm fixes landed.`,
      );
    }
  }

  if (negatives.length === 0) {
    return suggestions.length > 0
      ? suggestions.slice(0, 5)
      : [
          "Customer sentiment is stable this period; reinforce your strongest experiences in public replies.",
          "Promote your top-praised strengths in social posts and review request campaigns.",
        ];
  }

  const top = negatives.slice(0, 3);
  for (const n of top) {
    if (industry === "restaurant") {
      suggestions.push(
        `Customers flagged ${humanAspect(n.aspect)}${n.entityName ? ` (${n.entityName})` : ""}; review prep SOP and service checks this week.`,
      );
    } else if (industry === "healthcare") {
      suggestions.push(`Address ${humanAspect(n.aspect)} feedback with a structured staff briefing and patient-comms check-in.`);
    } else if (industry === "hospitality") {
      suggestions.push(`Investigate ${humanAspect(n.aspect)} issues and assign a 7-day quality owner with daily checkpoints.`);
    } else if (industry === "travel") {
      suggestions.push(`Audit ${humanAspect(n.aspect)} touchpoints and proactively message upcoming travelers with contingencies.`);
    } else {
      suggestions.push(`Prioritize fixes around ${humanAspect(n.aspect)} based on recent negative patterns.`);
    }
  }

  return [...new Set(suggestions)].slice(0, 6);
}

function humanAspect(aspect: string): string {
  return aspect.replace(/_/g, " ");
}
