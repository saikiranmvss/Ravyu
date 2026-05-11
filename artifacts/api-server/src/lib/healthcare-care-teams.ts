import { createHash } from "node:crypto";
import { detectSentiment } from "./industry-intelligence";

export type CareTeamInsight = {
  /** Deterministic anonymized label — never raw names. */
  label: string;
  positives: number;
  negatives: number;
  neutrals: number;
};

function anonymizeCareTeamLabel(normalizedFragment: string): string {
  const h = createHash("sha256").update(normalizedFragment.toLowerCase()).digest("hex").slice(0, 5);
  return `Care team · ${h}`;
}

/** Finds explicit doctor references and maps each to a stable anonymized bucket. */
export function extractCareTeamLabels(text: string): string[] {
  const matches = text.matchAll(/\b(?:dr\.?|doctor)\s+([a-z][a-z'\-]{1,28})/gi);
  const labels = new Set<string>();
  for (const m of matches) {
    const full = `${m[0]}`.trim();
    labels.add(anonymizeCareTeamLabel(full));
  }
  return [...labels];
}

export function aggregateCareTeamInsights(reviews: Array<{ text: string }>): CareTeamInsight[] {
  const map = new Map<string, { pos: number; neg: number; neu: number }>();
  for (const r of reviews) {
    const labs = extractCareTeamLabels(r.text);
    if (labs.length === 0) continue;
    const s = detectSentiment(r.text);
    for (const label of labs) {
      const row = map.get(label) ?? { pos: 0, neg: 0, neu: 0 };
      if (s === "positive") row.pos += 1;
      else if (s === "negative") row.neg += 1;
      else row.neu += 1;
      map.set(label, row);
    }
  }
  return [...map.entries()]
    .map(([label, v]) => ({
      label,
      positives: v.pos,
      negatives: v.neg,
      neutrals: v.neu,
    }))
    .sort((a, b) => b.negatives + b.positives - (a.negatives + a.positives));
}
