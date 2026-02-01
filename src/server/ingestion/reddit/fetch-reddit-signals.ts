import type {
  IngestionTarget,
  SignalCandidate,
} from "@/server/ingestion/types";

// Placeholder fetcher. Will be implemented once Reddit API access is approved.
export function fetchRedditCandidates(
  _target: IngestionTarget,
): Promise<Array<SignalCandidate>> {
  return Promise.resolve([]);
}
