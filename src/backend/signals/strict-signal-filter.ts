import type {
  FitGrade,
  PromoRisk,
  ValidatorDecision,
} from "@/backend/ingestion/types";
import { SIGNALS_KNOBS } from "@/backend/config/knobs";

type StrictFilterQuery<T> = {
  eq: (column: string, value: unknown) => T;
  gte: (column: string, value: number) => T;
};

export type StrictSignalLike = {
  score: number;
  specificAsk: boolean;
  fitGrade: FitGrade;
  promoRisk: PromoRisk;
  validatorDecision: ValidatorDecision | null;
  validatorConfidence: number | null;
};

export function isStrictShowEligible(signal: StrictSignalLike): boolean {
  if (signal.score < SIGNALS_KNOBS.minScoreToShowInUi) return false;
  if (!signal.specificAsk) return false;
  if (signal.fitGrade !== "strong") return false;
  if (signal.promoRisk !== "low") return false;
  if (signal.validatorDecision !== "approve") return false;
  if (
    (signal.validatorConfidence ?? 0) <
    SIGNALS_KNOBS.validatorMinConfidenceToShow
  ) {
    return false;
  }

  return true;
}

export function applyStrictSignalFilters<T extends StrictFilterQuery<T>>(
  query: T,
): T {
  return query
    .gte("score", SIGNALS_KNOBS.minScoreToShowInUi)
    .eq("specific_ask", true)
    .eq("fit_grade", "strong")
    .eq("promo_risk", "low")
    .eq("validator_decision", "approve")
    .gte("validator_confidence", SIGNALS_KNOBS.validatorMinConfidenceToShow);
}
