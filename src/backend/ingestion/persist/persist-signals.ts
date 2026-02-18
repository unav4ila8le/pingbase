import type {
  IngestionTarget,
  ScoredSignalCandidate,
} from "@/backend/ingestion/types";
import { INGESTION_KNOBS } from "@/backend/config/knobs";
import type { Json } from "@/types/database.types";
import { createServiceClient } from "@/lib/supabase/service";

export async function persistSignals(
  target: IngestionTarget,
  signals: Array<ScoredSignalCandidate>,
): Promise<{ inserted: number }> {
  const toStore = signals.filter(
    (s) => s.score >= INGESTION_KNOBS.minScoreToStore,
  );
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
