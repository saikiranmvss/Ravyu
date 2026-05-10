import { Router } from "express";
import { GenerateReplyBody, GeneratePostBody, GenerateContentBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { normalizeIndustry } from "../lib/feature-flags";
import { extractInsightsFromReview } from "../lib/industry-intelligence";

const router = Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(messages: Array<{ role: string; content: string }>, model = "gpt-4o-mini"): Promise<string> {
  if (!OPENAI_API_KEY) {
    // Demo fallback
    return messages[messages.length - 1].content.includes("reply")
      ? "Thank you so much for your kind words! We truly appreciate you taking the time to share your experience. It's wonderful to hear that we met your expectations, and we look forward to serving you again soon!"
      : "✨ We're thrilled to share this amazing review! Our team works hard every day to deliver excellence. Thank you for choosing us — your satisfaction is our greatest reward. #CustomerLove #Excellence #ThankYou";
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model, messages, max_tokens: 500 }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message.content ?? "";
}

function sentimentFromRating(rating: number): "positive" | "neutral" | "negative" {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

function toneInstruction(tone = "professional"): string {
  const map: Record<string, string> = {
    professional: "Use a professional and polished tone.",
    casual: "Use a friendly and casual tone.",
    enthusiastic: "Use an enthusiastic and energetic tone with exclamation points.",
    formal: "Use a formal and business-appropriate tone.",
    humorous: "Use a warm, slightly humorous and light-hearted tone.",
  };
  return map[tone] ?? map.professional!;
}

router.post("/generate-reply", requireAuth, async (req: AuthRequest, res) => {
  const parse = GenerateReplyBody.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: "Validation error" }); return; }
  const { reviewText, rating, author, businessName, tone } = parse.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const industry = normalizeIndustry(user?.industry);
  const insights = extractInsightsFromReview(reviewText, industry);
  const topInsight = insights[0];

  const systemPrompt = `You are a professional business reputation manager. Generate a concise, genuine response to a customer review. ${toneInstruction(tone ?? "professional")} Keep responses under 150 words. Do not include placeholders like [Business Name] — use the actual name if provided. Add context-aware acknowledgment when a specific issue or praised area is mentioned.`;
  const userPrompt = `Business: ${businessName ?? "our business"}
Customer: ${author ?? "Valued Customer"}
Rating: ${rating}/5
Review: "${reviewText}"
Industry: ${industry}
Primary detected aspect: ${topInsight?.aspect ?? "general"}${topInsight?.entityName ? ` (${topInsight.entityName})` : ""}

Write a reply to this review.`;

  try {
    const reply = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    res.json({ reply, sentiment: sentimentFromRating(rating) });
  } catch (err) {
    req.log.error({ err }, "AI generate-reply failed");
    res.status(500).json({ error: "AI generation failed" });
  }
});

router.post("/generate-post", requireAuth, async (req: AuthRequest, res) => {
  const parse = GeneratePostBody.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: "Validation error" }); return; }
  const { reviewText, platform, tone } = parse.data;

  const platformGuide: Record<string, string> = {
    instagram: "Write an engaging Instagram caption (max 200 chars) with 3-5 relevant hashtags at the end.",
    facebook: "Write a Facebook post (max 250 chars) that encourages engagement.",
    twitter: "Write a tweet (max 280 chars) that is punchy and shareable.",
    linkedin: "Write a professional LinkedIn post (max 300 chars) highlighting the customer satisfaction.",
    google_business: "Write a brief Google Business post (max 200 chars) highlighting this positive feedback.",
  };

  const systemPrompt = `You are a social media content expert. ${toneInstruction(tone ?? "professional")} ${platformGuide[platform] ?? platformGuide.instagram}`;
  const userPrompt = `Create a social media post based on this customer review: "${reviewText}"`;

  try {
    const caption = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    res.json({ caption, imageUrl: null });
  } catch (err) {
    req.log.error({ err }, "AI generate-post failed");
    res.status(500).json({ error: "AI generation failed" });
  }
});

router.post("/generate-content", requireAuth, async (req: AuthRequest, res) => {
  const parse = GenerateContentBody.safeParse(req.body);
  if (!parse.success) { res.status(400).json({ error: "Validation error" }); return; }
  const { prompt, platform, contentType, tone } = parse.data;

  const platformGuide: Record<string, string> = {
    instagram: "Optimized for Instagram.",
    facebook: "Optimized for Facebook.",
    twitter: "Optimized for Twitter/X (max 280 chars).",
    linkedin: "Optimized for LinkedIn professionals.",
    google_business: "Optimized for Google Business posts.",
  };

  const systemPrompt = `You are a social media content expert. ${toneInstruction(tone ?? "professional")} Generate ${contentType === "image" ? "an image prompt and caption" : "a post"} for ${platform}. ${platformGuide[platform] ?? ""}`;

  try {
    const content = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ]);
    res.json({ content, imageUrl: null });
  } catch (err) {
    req.log.error({ err }, "AI generate-content failed");
    res.status(500).json({ error: "AI generation failed" });
  }
});

export default router;
