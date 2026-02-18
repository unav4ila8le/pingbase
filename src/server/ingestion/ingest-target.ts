import type {
  IngestionTarget,
  ScoredSignalCandidate,
  SignalCandidate,
} from "@/server/ingestion/types";
import { fetchRedditCandidates } from "@/server/ingestion/reddit/fetch-reddit-signals";
import { scoreSignalCandidate } from "@/server/ingestion/score/score-signal";
import { persistSignals } from "@/server/ingestion/persist/persist-signals";

const HOURS_BEFORE_TARGET = 24;

const isWithinValidWindow = (
  target: IngestionTarget,
  candidate: SignalCandidate,
) => {
  const createdAt = new Date(target.created_at).getTime();
  const cutoff = createdAt - HOURS_BEFORE_TARGET * 60 * 60 * 1000;
  const postedAt = new Date(candidate.datePosted).getTime();
  return postedAt >= cutoff;
};

export async function ingestTarget(target: IngestionTarget) {
  const candidates = await fetchRedditCandidates(target);
  const freshCandidates = candidates.filter((candidate) =>
    isWithinValidWindow(target, candidate),
  );

  const scored: Array<ScoredSignalCandidate> = [];
  for (const candidate of freshCandidates) {
    const scoreResult = await scoreSignalCandidate(target, candidate);
    scored.push({
      ...candidate,
      score: scoreResult.score,
      reason: scoreResult.reason,
    });
  }

  return persistSignals(target, scored);
}
