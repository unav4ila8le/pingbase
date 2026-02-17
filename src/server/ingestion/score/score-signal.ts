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
    "Task: Score relevance from 0-100 and explain why in 1-2 sentences.",
    "Return only the structured output.",
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
    system: `You are a relevance scorer for a tool that helps users find places to engage (e.g. share a product, offer advice).
Be strict and conservative. Favor precision over recall.
Deprioritize: celebrity news, third-party product launches, or content where engagement would feel forced.
Prioritize: posts where someone is asking for help, sharing their own situation, or discussing relevant tools.`,
    prompt: buildPrompt(target, signal),
  });

  return output;
}
