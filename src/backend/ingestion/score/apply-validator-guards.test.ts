import { describe, expect, it } from "vitest";

import type { ValidateSignalResult } from "@/backend/ingestion/types";
import {
  BRAND_MENTION_NOT_NATURAL_REASON,
  applyValidatorGuards,
} from "@/backend/ingestion/score/apply-validator-guards";

function makeValidatorResult(
  overrides: Partial<ValidateSignalResult> = {},
): ValidateSignalResult {
  return {
    decision: "approve",
    confidence: 90,
    reason: "Clear value-first response opportunity.",
    failureReason: null,
    brandMentionNatural: true,
    ...overrides,
  };
}

describe("applyValidatorGuards", () => {
  it("keeps approved result when brand mention is natural", () => {
    const result = applyValidatorGuards(makeValidatorResult());
    expect(result.decision).toBe("approve");
    expect(result.failureReason).toBeNull();
  });

  it("forces reject when brand mention is not natural", () => {
    const result = applyValidatorGuards(
      makeValidatorResult({ brandMentionNatural: false }),
    );
    expect(result.decision).toBe("reject");
    expect(result.failureReason).toBe(BRAND_MENTION_NOT_NATURAL_REASON);
    expect(result.reason).toContain("Brand mention is likely forced");
  });

  it("preserves existing failure reason for already rejected results", () => {
    const result = applyValidatorGuards(
      makeValidatorResult({
        decision: "reject",
        failureReason: "fit_not_strong",
        brandMentionNatural: false,
      }),
    );
    expect(result.decision).toBe("reject");
    expect(result.failureReason).toBe("fit_not_strong");
  });
});
