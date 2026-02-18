import { Output, generateText } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";

import type {
  IngestionTarget,
  SignalCandidate,
} from "@/server/ingestion/types";

const scoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  reason: z.string().min(1),
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
    `Title: ${signal.title ?? "N/A"}`,
    `Excerpt: ${signal.contentExcerpt}`,
    "",
    "Task: Score ACTIONABILITY 0-100. A signal is actionable only when:",
    "1. The poster has a SPECIFIC question or expressed need (not a generic discussion).",
    "2. The target could DIRECTLY answer or solve that need.",
    "3. A founder replying here would read as helpful advice, not a promotional plug.",
    "",
    "Score high (75+) only when all three are true. Score low (<50) when the post lacks a specific ask, is a catch-all thread, or would make the target feel like spam.",
    "Explain in 1-2 sentences. Return only the structured output.",
  ].join("\n");
};

export async function scoreSignalCandidate(
  target: IngestionTarget,
  signal: SignalCandidate,
) {
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
- Actionable: The poster has a specific question or problem; the target (product/brand) could directly help; a reply would read as helpful, not promotional.
- Not actionable: Same topic but no concrete ask; generic discussion; catch-all threads; news/meta; posts where the target would feel like spam.

ALWAYS SCORE LOW (<50) for:
- Daily/weekly discussion threads, sticky posts, "megathreads"
- Generic "what do you think?" or "thoughts on X?" with no specific question
- News articles, announcements, or commentary (not asking for help)
- AutoModerator or bot posts
- Posts where the target tangentially fits but wouldn't solve the poster's actual question

Use the target's name, description, and keywords to infer what problem it solves. Be strict: when in doubt, score lower. High scores (75+) require a clear, specific need the target addresses.`,
    prompt: buildPrompt(target, signal),
  });

  return output;
}
