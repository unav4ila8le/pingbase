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
    "Task: Score product-fit relevance 0-100. Ask: would recommending this target here feel natural and helpful? Explain in 1-2 sentences.",
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
    system: `You are a relevance scorer for a tool that helps founders/brands find posts where they can genuinely engage (e.g. share their product, offer advice).

Scoring criterion: PRODUCT-FIT RELEVANCE, not topic relevance.

- Product-fit relevance: The post exhibits an implied or explicit need that the target (product/brand) directly addresses. Someone could naturally and helpfully mention the target here.
- Topic relevance (insufficient alone): The post is merely in the same broad domain. Same category ≠ good fit.

Use the target's name, description, and keywords to infer what problem it solves and who it serves. Score high (75+) only when the post clearly has a need this target could fulfill. Score low (<50) when the post is tangentially related but mentioning the target would feel forced or off-topic.

Be strict. Deprioritize: celebrity news, generic advice threads where the target doesn't solve the specific question, or content where engagement would feel promotional.`,
    prompt: buildPrompt(target, signal),
  });

  return output;
}
