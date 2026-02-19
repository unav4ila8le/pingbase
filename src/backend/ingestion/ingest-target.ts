import type {
  IngestionTarget,
  ScoredSignalCandidate,
  SignalCandidate,
} from "@/backend/ingestion/types";
import { INGESTION_KNOBS } from "@/backend/config/knobs";
import { fetchRedditCandidates } from "@/backend/ingestion/reddit/fetch-reddit-signals";
import { prefilterRedditCandidates } from "@/backend/ingestion/reddit/prefilter-reddit-candidates";
import { applyScoreGuards } from "@/backend/ingestion/score/apply-score-guards";
import { scoreSignalCandidate } from "@/backend/ingestion/score/score-signal";
import { validateSignalCandidate } from "@/backend/ingestion/score/validate-signal";
import { persistSignals } from "@/backend/ingestion/persist/persist-signals";
import { updateTargetLastScannedAt } from "@/backend/targets/update-target-last-scanned-at";

const VALIDATOR_REJECT_MAX_SCORE = 49;
const SHOW_SCORE_THRESHOLD = 75;
const SHOW_VALIDATOR_CONFIDENCE_THRESHOLD = 70;

type IngestTargetResult = {
  inserted: number;
  fetchedCount: number;
  freshCount: number;
  prefilterAcceptedCount: number;
  prefilterRejectedCount: number;
  prefilterRejectReasons: Record<string, number>;
  scoredCount: number;
  validatedCount: number;
  validatorRejectedCount: number;
  showEligibleCount: number;
};

function getCutoffTimestamp(target: IngestionTarget): number {
  if (target.last_scanned_at) {
    return new Date(target.last_scanned_at).getTime();
  }
  const createdAt = new Date(target.created_at).getTime();
  return createdAt - INGESTION_KNOBS.initialLookbackHours * 60 * 60 * 1000;
}

function isNewerThanCutoff(
  candidate: SignalCandidate,
  cutoffMs: number,
): boolean {
  const postedAt = new Date(candidate.datePosted).getTime();
  return postedAt > cutoffMs;
}

export async function ingestTarget(
  target: IngestionTarget,
): Promise<IngestTargetResult> {
  const cutoffMs = getCutoffTimestamp(target);

  const candidates = await fetchRedditCandidates(target);
  const freshCandidates = candidates.filter((c) =>
    isNewerThanCutoff(c, cutoffMs),
  );
  const prefilterResult = prefilterRedditCandidates(target, freshCandidates);
  const prefilterRejectReasons = prefilterResult.rejected.reduce<
    Record<string, number>
  >((acc, rejected) => {
    acc[rejected.reason] = (acc[rejected.reason] ?? 0) + 1;
    return acc;
  }, {});

  const scored: Array<ScoredSignalCandidate> = [];
  let validatedCount = 0;
  let validatorRejectedCount = 0;
  for (
    let i = 0;
    i < prefilterResult.accepted.length;
    i += INGESTION_KNOBS.llmConcurrency
  ) {
    const chunk = prefilterResult.accepted.slice(
      i,
      i + INGESTION_KNOBS.llmConcurrency,
    );
    const results = await Promise.all(
      chunk.map(async (candidate) => {
        const stage1 = applyScoreGuards(
          await scoreSignalCandidate(target, candidate),
        );
        let score = stage1.score;
        let reason = stage1.reason;
        let validator: ScoredSignalCandidate["validator"] = null;

        if (score >= INGESTION_KNOBS.minScoreForValidation) {
          validatedCount += 1;
          validator = await validateSignalCandidate(target, candidate, stage1);

          if (validator.decision === "reject") {
            validatorRejectedCount += 1;
            score = Math.min(score, VALIDATOR_REJECT_MAX_SCORE);
            reason = `${reason} Validator: ${validator.reason}`;
          }
        }

        return {
          ...candidate,
          score,
          reason,
          stage1,
          validator,
        } satisfies ScoredSignalCandidate;
      }),
    );
    scored.push(...results);
  }

  const result = await persistSignals(target, scored);
  const showEligibleCount = scored.filter((s) => {
    if (s.score < SHOW_SCORE_THRESHOLD) return false;
    if (!s.stage1?.specificAsk) return false;
    if (s.stage1.fitGrade !== "strong") return false;
    if (s.stage1.promoRisk !== "low") return false;
    if (s.validator?.decision !== "approve") return false;
    if (
      (s.validator.confidence ?? 0) < SHOW_VALIDATOR_CONFIDENCE_THRESHOLD
    ) {
      return false;
    }
    return true;
  }).length;

  await updateTargetLastScannedAt(target.id);

  return {
    inserted: result.inserted,
    fetchedCount: candidates.length,
    freshCount: freshCandidates.length,
    prefilterAcceptedCount: prefilterResult.accepted.length,
    prefilterRejectedCount: prefilterResult.rejected.length,
    prefilterRejectReasons,
    scoredCount: scored.length,
    validatedCount,
    validatorRejectedCount,
    showEligibleCount,
  };
}
