import type {
  IngestionTarget,
  ScoredSignalCandidate,
  SignalCandidate,
} from "@/server/ingestion/types";
import { fetchRedditCandidates } from "@/server/ingestion/reddit/fetch-reddit-signals";
import { scoreSignalCandidate } from "@/server/ingestion/score/score-signal";
import { persistSignals } from "@/server/ingestion/persist/persist-signals";
import { updateTargetLastScannedAt } from "@/server/targets/update-target-last-scanned-at";

const HOURS_BEFORE_TARGET = 24;
const LLM_CONCURRENCY = 8;

function getCutoffTimestamp(target: IngestionTarget): number {
  if (target.last_scanned_at) {
    return new Date(target.last_scanned_at).getTime();
  }
  const createdAt = new Date(target.created_at).getTime();
  return createdAt - HOURS_BEFORE_TARGET * 60 * 60 * 1000;
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
  for (let i = 0; i < freshCandidates.length; i += LLM_CONCURRENCY) {
    const chunk = freshCandidates.slice(i, i + LLM_CONCURRENCY);
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
