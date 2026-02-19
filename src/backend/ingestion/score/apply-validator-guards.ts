import type { ValidateSignalResult } from "@/backend/ingestion/types";

export const BRAND_MENTION_NOT_NATURAL_REASON = "brand_mention_not_natural";

export function applyValidatorGuards(
  result: ValidateSignalResult,
): ValidateSignalResult {
  if (result.brandMentionNatural) {
    return result;
  }

  return {
    ...result,
    decision: "reject",
    failureReason: result.failureReason ?? BRAND_MENTION_NOT_NATURAL_REASON,
    reason:
      result.decision === "approve"
        ? `${result.reason} Brand mention is likely forced for this post.`
        : result.reason,
  };
}
