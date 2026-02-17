import type {
  IngestionTarget,
  ScoredSignalCandidate,
} from "@/server/ingestion/types";
import type { Json } from "@/types/database.types";
import { createServiceClient } from "@/lib/supabase/service";

/** Minimum score to persist; scores 40–69 are stored but hidden from UI. */
const MIN_SCORE_TO_STORE = 40;

export async function persistSignals(
  target: IngestionTarget,
  signals: Array<ScoredSignalCandidate>,
): Promise<{ inserted: number }> {
  const toStore = signals.filter((s) => s.score >= MIN_SCORE_TO_STORE);
  if (toStore.length === 0) return { inserted: 0 };

  const supabase = createServiceClient();

  const rows = toStore.map((s) => ({
    target_id: target.id,
    user_id: target.user_id,
    platform: s.platform,
    type: s.type,
    url: s.url,
    external_id: s.externalId,
    community: s.community,
    title: s.title,
    content_excerpt: s.contentExcerpt,
    date_posted: s.datePosted,
    score: s.score,
    reason: s.reason,
    status: "new" as const,
    raw_payload: (s.rawPayload ?? {}) as Json,
  }));

  const { data, error } = await supabase
    .from("signals")
    .upsert(rows, {
      onConflict: "target_id,platform,external_id",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) {
    throw new Error(`Failed to persist signals: ${error.message}`);
  }

  return { inserted: data?.length ?? 0 };
}
