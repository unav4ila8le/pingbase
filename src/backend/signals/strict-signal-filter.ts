import { SIGNALS_KNOBS } from "@/backend/config/knobs";

type StrictFilterQuery<T> = {
  eq: (column: string, value: unknown) => T;
  gte: (column: string, value: number) => T;
};

export function applyStrictSignalFilters<T extends StrictFilterQuery<T>>(
  query: T,
): T {
  return query
    .gte("score", SIGNALS_KNOBS.minScoreToShowInUi)
    .eq("specific_ask", true)
    .eq("fit_grade", "strong")
    .eq("promo_risk", "low")
    .eq("validator_decision", "approve")
    .gte(
      "validator_confidence",
      SIGNALS_KNOBS.validatorMinConfidenceToShow,
    );
}
