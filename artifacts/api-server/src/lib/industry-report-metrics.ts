/** Date-window helpers and momentum math for industry reports. */

export type InsightLike = {
  createdAt: Date | string;
  aspect: string;
  sentiment: string;
};

export function splitCurrentPriorInsights<T extends InsightLike>(
  insights: T[],
  windowDays: number,
): { current: T[]; prior: T[] } {
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const currentFrom = now - windowMs;
  const priorFrom = now - 2 * windowMs;
  const current: T[] = [];
  const prior: T[] = [];
  for (const i of insights) {
    const t = new Date(i.createdAt).getTime();
    if (t >= currentFrom) current.push(i);
    else if (t >= priorFrom && t < currentFrom) prior.push(i);
  }
  return { current, prior };
}

export function sentimentTrend<T extends InsightLike>(rows: T[]): { positive: number; neutral: number; negative: number } {
  return {
    positive: rows.filter((i) => i.sentiment === "positive").length,
    neutral: rows.filter((i) => i.sentiment === "neutral").length,
    negative: rows.filter((i) => i.sentiment === "negative").length,
  };
}

export type AspectMomentumRow = {
  aspect: string;
  negativeCount: number;
  priorNegativeCount: number;
  /** Null when prior period had zero negatives (avoid divide-by-zero noise). */
  changePercent: number | null;
};

export function buildAspectMomentum<T extends InsightLike>(current: T[], prior: T[]): AspectMomentumRow[] {
  const negCurrent = new Map<string, number>();
  const negPrior = new Map<string, number>();
  for (const i of current) {
    if (i.sentiment === "negative") negCurrent.set(i.aspect, (negCurrent.get(i.aspect) ?? 0) + 1);
  }
  for (const i of prior) {
    if (i.sentiment === "negative") negPrior.set(i.aspect, (negPrior.get(i.aspect) ?? 0) + 1);
  }
  const aspects = new Set([...negCurrent.keys(), ...negPrior.keys()]);
  const out: AspectMomentumRow[] = [];
  for (const aspect of aspects) {
    const negativeCount = negCurrent.get(aspect) ?? 0;
    const priorNegativeCount = negPrior.get(aspect) ?? 0;
    let changePercent: number | null = null;
    if (priorNegativeCount > 0) {
      changePercent = Math.round(((negativeCount - priorNegativeCount) / priorNegativeCount) * 100);
    } else if (negativeCount > 0 && priorNegativeCount === 0) {
      changePercent = 100;
    }
    out.push({ aspect, negativeCount, priorNegativeCount, changePercent });
  }
  return out.sort((a, b) => b.negativeCount - a.negativeCount);
}

export function buildHospitalityTrendSummary(aspectMomentum: AspectMomentumRow[]): string | null {
  const spike = aspectMomentum.find((a) => a.changePercent !== null && a.changePercent >= 25 && a.negativeCount >= 2);
  if (spike) {
    return `${humanAspect(spike.aspect)} feedback worsened notably vs the prior period — prioritize inspections and staff coaching.`;
  }
  const steady = aspectMomentum.find((a) => a.negativeCount >= 3);
  if (steady) {
    return `${humanAspect(steady.aspect)} remains a recurring theme; align housekeeping and guest communications.`;
  }
  return null;
}

function humanAspect(aspect: string): string {
  return aspect.replace(/_/g, " ");
}

export function computeTravelEarlyWarning(
  currentWeek: InsightLike[],
  priorWeek: InsightLike[],
): { level: "none" | "watch" | "elevated"; summary: string; factors: string[] } {
  const ct = sentimentTrend(currentWeek);
  const pt = sentimentTrend(priorWeek);
  const factors: string[] = [];
  if (ct.negative >= 2 && ct.negative > pt.negative) {
    factors.push("Negative signals increased vs the prior week.");
  }
  if (ct.negative >= pt.negative * 1.5 && pt.negative >= 1) {
    factors.push("Complaint velocity accelerated week over week.");
  }
  const negJump = pt.negative === 0 ? ct.negative : Math.round(((ct.negative - pt.negative) / Math.max(pt.negative, 1)) * 100);

  let level: "none" | "watch" | "elevated" = "none";
  if (ct.negative >= 4 || negJump >= 80) level = "elevated";
  else if (ct.negative >= 2 || negJump >= 40) level = "watch";

  if (level === "none") {
    return {
      level,
      summary: "Tour signals look steady — continue proactive guest messaging.",
      factors: [],
    };
  }
  if (level === "watch") {
    return {
      level,
      summary: "Early warning: rising dissatisfaction vs last week — intervene before public reviews amplify.",
      factors,
    };
  }
  return {
    level,
    summary: "Elevated risk: sustained negative tour signals — escalate host operations and outreach.",
    factors,
  };
}

export function negativeSentimentMomentum(
  currentTrend: { negative: number },
  priorTrend: { negative: number },
): { negativeDeltaPercent: number | null; summary: string } {
  const cur = currentTrend.negative;
  const prev = priorTrend.negative;
  if (prev === 0 && cur === 0) {
    return { negativeDeltaPercent: null, summary: "No negative signals in either period — keep monitoring." };
  }
  if (prev === 0 && cur > 0) {
    return {
      negativeDeltaPercent: 100,
      summary: "Negative feedback emerged this period after none in the prior window — prioritize follow-up.",
    };
  }
  if (prev > 0) {
    const pct = Math.round(((cur - prev) / prev) * 100);
    if (pct <= -10) {
      return { negativeDeltaPercent: pct, summary: `Negative mentions improved about ${Math.abs(pct)}% vs the prior period.` };
    }
    if (pct >= 10) {
      return { negativeDeltaPercent: pct, summary: `Negative mentions rose about ${pct}% vs the prior period — investigate root causes.` };
    }
    return { negativeDeltaPercent: pct, summary: "Negative volume is roughly stable period over period." };
  }
  return { negativeDeltaPercent: null, summary: "Momentum is steady." };
}
