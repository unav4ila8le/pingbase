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
    specific_ask: s.stage1?.specificAsk ?? false,
    fit_grade: s.stage1?.fitGrade ?? "none",
    promo_risk: s.stage1?.promoRisk ?? "high",
    scorer_confidence: s.stage1?.confidence ?? 0,
    rejection_reason: s.stage1?.rejectionReason ?? null,
    evidence_quote: s.stage1?.evidenceQuote ?? null,
    stage1_score: s.stage1?.score ?? null,
    validator_decision: s.validator?.decision ?? null,
    validator_confidence: s.validator?.confidence ?? null,
    validator_reason: s.validator?.reason ?? null,
    score_version: "v2",
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
