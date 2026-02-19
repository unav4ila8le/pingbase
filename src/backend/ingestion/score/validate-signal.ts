import { Output, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import type {
  IngestionTarget,
  ScoreSignalResult,
  SignalCandidate,
  ValidateSignalResult,
} from "@/backend/ingestion/types";

const validatorSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  confidence: z.number().int().min(0).max(100),
  reason: z.string().min(1),
  failureReason: z.string().trim().nullable(),
});

function buildValidatorPrompt(
  target: IngestionTarget,
  signal: SignalCandidate,
  stage1: ScoreSignalResult,
): string {
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
    `Community: ${signal.community}`,
    `Title: ${signal.title ?? "N/A"}`,
    `Excerpt: ${signal.contentExcerpt}`,
    "",
    "Stage-1 result:",
    `- score: ${stage1.score}`,
    `- reason: ${stage1.reason}`,
    `- specificAsk: ${stage1.specificAsk}`,
    `- fitGrade: ${stage1.fitGrade}`,
    `- promoRisk: ${stage1.promoRisk}`,
    `- confidence: ${stage1.confidence}`,
    "",
    "Task: validate this candidate with a strict precision-first bar.",
    "Reject when helpful advice would likely require overt promotion, fit is not truly strong, or ask is not specific enough.",
    "Approve only when this is clearly a high-quality, value-first engagement opportunity.",
    "Return only structured output.",
  ].join("\n");
}

export async function validateSignalCandidate(
  target: IngestionTarget,
  signal: SignalCandidate,
  stage1: ScoreSignalResult,
): Promise<ValidateSignalResult> {
  const modelName = process.env.OPENAI_VALIDATOR_MODEL ?? "gpt-5";
  const { output } = await generateText({
    model: openai(modelName),
    output: Output.object({
      schema: validatorSchema,
      name: "SignalValidation",
      description:
        "Strict second-stage validator for actionable brand engagement signals.",
    }),
    system: `You are a strict validator in a precision-first signal pipeline.
Your job is to reject borderline or weakly actionable candidates.
Approve only clearly actionable, value-first opportunities where advice can stand without a hard pitch.`,
    prompt: buildValidatorPrompt(target, signal, stage1),
  });

  return output;
}
