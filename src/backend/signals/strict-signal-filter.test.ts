import { describe, expect, it, vi } from "vitest";

import { SIGNALS_KNOBS } from "@/backend/config/knobs";
import { applyStrictSignalFilters } from "@/backend/signals/strict-signal-filter";

describe("applyStrictSignalFilters", () => {
  it("applies the strict show predicate fields", () => {
    const query = {
      eq: vi.fn(),
      gte: vi.fn(),
    };

    query.eq.mockReturnValue(query);
    query.gte.mockReturnValue(query);

    const result = applyStrictSignalFilters(query);

    expect(result).toBe(query);
    expect(query.gte).toHaveBeenNthCalledWith(
      1,
      "score",
      SIGNALS_KNOBS.minScoreToShowInUi,
    );
    expect(query.eq).toHaveBeenNthCalledWith(1, "specific_ask", true);
    expect(query.eq).toHaveBeenNthCalledWith(2, "fit_grade", "strong");
    expect(query.eq).toHaveBeenNthCalledWith(3, "promo_risk", "low");
    expect(query.eq).toHaveBeenNthCalledWith(4, "validator_decision", "approve");
    expect(query.gte).toHaveBeenNthCalledWith(
      2,
      "validator_confidence",
      SIGNALS_KNOBS.validatorMinConfidenceToShow,
    );
  });
});
