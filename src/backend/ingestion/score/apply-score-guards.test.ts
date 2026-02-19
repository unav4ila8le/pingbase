import { describe, expect, it } from "vitest";

import type { ScoreSignalResult } from "@/backend/ingestion/types";
import { applyScoreGuards } from "@/backend/ingestion/score/apply-score-guards";

function makeScoreResult(
  overrides: Partial<ScoreSignalResult> = {},
): ScoreSignalResult {
  return {
    score: 90,
    reason: "Looks actionable",
    specificAsk: true,
    fitGrade: "strong",
    promoRisk: "low",
    confidence: 85,
    rejectionReason: null,
    evidenceQuote: "How should I allocate my portfolio?",
    ...overrides,
  };
}

describe("applyScoreGuards", () => {
  it("caps score to 45 when specificAsk is false", () => {
    const result = applyScoreGuards(
      makeScoreResult({ score: 88, specificAsk: false }),
    );
    expect(result.score).toBe(45);
  });

  it("caps score to 69 when fit grade is not strong", () => {
    const result = applyScoreGuards(
      makeScoreResult({ score: 88, fitGrade: "partial" }),
    );
    expect(result.score).toBe(69);
  });

  it("caps score to 59 when promo risk is high", () => {
    const result = applyScoreGuards(
      makeScoreResult({ score: 88, promoRisk: "high" }),
    );
    expect(result.score).toBe(59);
  });

  it("applies the strictest cap when multiple guards trigger", () => {
    const result = applyScoreGuards(
      makeScoreResult({
        score: 95,
        specificAsk: false,
        fitGrade: "none",
        promoRisk: "high",
      }),
    );
    expect(result.score).toBe(45);
  });
});
