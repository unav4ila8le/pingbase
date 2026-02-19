import type { ScoreSignalResult } from "@/backend/ingestion/types";

const MIN_SCORE = 0;
const MAX_SCORE = 100;

function clampScore(score: number): number {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(score)));
}

export function applyScoreGuards(result: ScoreSignalResult): ScoreSignalResult {
  let guardedScore = clampScore(result.score);

  if (!result.specificAsk) {
    guardedScore = Math.min(guardedScore, 45);
  }

  if (result.fitGrade !== "strong") {
    guardedScore = Math.min(guardedScore, 69);
  }

  if (result.promoRisk === "high") {
    guardedScore = Math.min(guardedScore, 59);
  }

  return {
    ...result,
    score: guardedScore,
  };
}
