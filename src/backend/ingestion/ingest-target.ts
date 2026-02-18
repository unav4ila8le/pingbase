import type {
  IngestionTarget,
  ScoredSignalCandidate,
  SignalCandidate,
} from "@/backend/ingestion/types";
import { INGESTION_KNOBS } from "@/backend/config/knobs";
import { fetchRedditCandidates } from "@/backend/ingestion/reddit/fetch-reddit-signals";
import { scoreSignalCandidate } from "@/backend/ingestion/score/score-signal";
import { persistSignals } from "@/backend/ingestion/persist/persist-signals";
import { updateTargetLastScannedAt } from "@/backend/targets/update-target-last-scanned-at";

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

export async function ingestTarget(target: IngestionTarget) {
  const cutoffMs = getCutoffTimestamp(target);

  const candidates = await fetchRedditCandidates(target);
  const freshCandidates = candidates.filter((c) =>
    isNewerThanCutoff(c, cutoffMs),
  );

  const scored: Array<ScoredSignalCandidate> = [];
  for (
    let i = 0;
    i < freshCandidates.length;
    i += INGESTION_KNOBS.llmConcurrency
  ) {
    const chunk = freshCandidates.slice(i, i + INGESTION_KNOBS.llmConcurrency);
    const results = await Promise.all(
      chunk.map(async (candidate) => {
        const scoreResult = await scoreSignalCandidate(target, candidate);
        return {
          ...candidate,
          score: scoreResult.score,
          reason: scoreResult.reason,
        } satisfies ScoredSignalCandidate;
      }),
    );
    scored.push(...results);
  }

  const result = await persistSignals(target, scored);

  await updateTargetLastScannedAt(target.id);

  return result;
}
