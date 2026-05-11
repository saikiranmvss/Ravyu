import test from "node:test";
import assert from "node:assert/strict";
import { extractInsightsFromReview, buildActionSuggestions } from "./industry-intelligence";

test("extractInsightsFromReview captures restaurant aspect", () => {
  const insights = extractInsightsFromReview(
    "Chicken biryani was oily and delivery was late",
    "restaurant",
  );
  assert.ok(insights.some((i) => i.aspect === "taste" || i.aspect === "delivery"));
});

test("buildActionSuggestions returns targeted output for healthcare negatives", () => {
  const suggestions = buildActionSuggestions(
    [
      {
        entityName: null,
        aspect: "waiting_time",
        sentiment: "negative",
        reason: "Long queue reported",
        confidence: 0.9,
        severity: "medium",
      },
    ],
    "healthcare",
  );
  assert.ok(suggestions[0]?.toLowerCase().includes("briefing") || suggestions[0]?.toLowerCase().includes("staff"));
});
