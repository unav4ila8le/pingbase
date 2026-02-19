import { Output, generateText } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";

import type {
  IngestionTarget,
  ScoreSignalResult,
  SignalCandidate,
} from "@/backend/ingestion/types";

const scoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  reason: z.string().min(1),
  specificAsk: z.boolean(),
  fitGrade: z.enum(["none", "partial", "strong"]),
  promoRisk: z.enum(["low", "medium", "high"]),
  confidence: z.number().int().min(0).max(100),
  rejectionReason: z.string().trim().nullable(),
  evidenceQuote: z.string().trim().nullable(),
});

const buildPrompt = (target: IngestionTarget, signal: SignalCandidate) => {
  const keywords = target.keywords?.length
    ? target.keywords.join(", ")
    : "None";
  const exclusions = target.exclusions?.length
    ? target.exclusions.join(", ")
    : "None";

  return [
    `Target name: ${target.name}`,
    `Target description: ${target.description}`,
    `Keywords: ${keywords}`,
    `Exclusions: ${exclusions}`,
    "",
    `Content type: ${signal.type}`,
    `Community: ${signal.community}`,
    `Author: ${signal.author ?? "N/A"}`,
    `Link flair: ${signal.linkFlairText ?? "N/A"}`,
    `Post hint: ${signal.postHint ?? "N/A"}`,
    `Domain: ${signal.domain ?? "N/A"}`,
    `Stickied: ${signal.stickied}`,
    `Locked: ${signal.locked}`,
    `Title: ${signal.title ?? "N/A"}`,
    `Excerpt: ${signal.contentExcerpt}`,
    "",
    "Task: Score ACTIONABILITY 0-100.",
    "A signal is actionable only when ALL are true:",
    "1) The poster has a concrete, specific question or need.",
    "2) The target is a strong direct fit for that need.",
    "3) A value-first reply is possible without requiring a hard product pitch.",
    "",
    "Field definitions:",
    "- specificAsk: true only if there is a concrete ask/problem.",
    "- fitGrade: strong only when the ask naturally maps to the target's tooling/workflow. Use partial for generic finance advice where a product mention would be optional.",
    "- promoRisk: low when advice can stand on its own; high when the reply would likely read as promotional.",
    "- confidence: confidence in this judgment (0-100).",
    "- rejectionReason: short reason when not clearly actionable; otherwise null.",
    "- evidenceQuote: short quote from the post that supports your decision; null if none.",
    "",
    "Scoring rubric:",
    "- 75-100: specific ask + strong fit + low promo risk.",
    "- 50-74: some usefulness but weak fit or medium promo risk.",
    "- 0-49: non-actionable, generic, weak fit, or likely promotional/spammy.",
    "",
    "Be strict. Prefer lower scores for ambiguous cases.",
    "Return only the structured output.",
  ].join("\n");
};

export async function scoreSignalCandidate(
  target: IngestionTarget,
  signal: SignalCandidate,
): Promise<ScoreSignalResult> {
  const modelName = process.env.OPENAI_MODEL ?? "gpt-5-mini";
  const { output } = await generateText({
    model: openai(modelName),
    output: Output.object({
      schema: scoreSchema,
      name: "SignalRelevance",
      description: "Relevance score and reason for a target match.",
    }),
    system: `You are a relevance scorer for a tool that helps founders/brands find posts where they can genuinely engage (share their product, offer advice). Your job is to surface ACTIONABLE signals only.

SCORING CRITERION: ACTIONABILITY
- Actionable means: specific ask + strong direct fit + low promotional risk.
- Non-actionable means: generic discussion, weak fit, no concrete ask, or likely self-promo.

For portfolio tools, generic investing threads (asset allocation, ETF picks, FIRE math, retirement timing) are usually PARTIAL fit unless the post explicitly asks for tooling/workflow help, tracker/app recommendations, scenario modeling, or spreadsheet replacement.

ALWAYS SCORE LOW (<50) for:
- Daily/weekly discussion threads, sticky posts, "megathreads"
- Generic "what do you think?" or "thoughts on X?" with no specific question
- News articles, announcements, or commentary (not asking for help)
- AutoModerator or bot posts
- Posts where the target tangentially fits but wouldn't solve the poster's actual question

Use the target's name, description, keywords, and exclusions to infer what problem it solves.
Value-first rule: if a helpful reply would require mentioning the product to be useful, classify promoRisk as high and score lower.
Be strict: when in doubt, score lower.`,
    prompt: buildPrompt(target, signal),
  });

  return output;
}
