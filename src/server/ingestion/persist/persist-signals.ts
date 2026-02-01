import type {
  IngestionTarget,
  ScoredSignalCandidate,
} from "@/server/ingestion/types";

// Placeholder persistence. Will insert into Supabase once ingestion is wired.
export function persistSignals(
  _target: IngestionTarget,
  _signals: Array<ScoredSignalCandidate>,
) {
  return { inserted: 0 };
}
