import { defineTask } from "nitro/task";
import { fetchAllTargets } from "../../../src/backend/targets/fetch-all-targets";
import { ingestTarget } from "../../../src/backend/ingestion/ingest-target";

export type IngestionRunResult = {
  targetsProcessed: number;
  inserted: number;
  errors: number;
  durationMs: number;
  fetched: number;
  fresh: number;
  prefilterAccepted: number;
  prefilterRejected: number;
  scored: number;
  validated: number;
  validatorRejected: number;
  showEligible: number;
  prefilterRejectReasons: Record<string, number>;
};

export default defineTask({
  meta: {
    name: "ingestion:run",
    description:
      "Fetch all targets, ingest Reddit signals, score with LLM, and persist",
  },
  async run() {
    const startedAt = Date.now();
    const targets = await fetchAllTargets();

    console.log("[ingestion:run] Started", {
      targetCount: targets.length,
      targetIds: targets.map((t) => t.id),
    });

    let totalInserted = 0;
    let totalFetched = 0;
    let totalFresh = 0;
    let totalPrefilterAccepted = 0;
    let totalPrefilterRejected = 0;
    let totalScored = 0;
    let totalValidated = 0;
    let totalValidatorRejected = 0;
    let totalShowEligible = 0;
    const prefilterRejectReasons: Record<string, number> = {};
    const errors: Array<{ targetId: string; error: string }> = [];

    for (const target of targets) {
      try {
        const result = await ingestTarget(target);
        totalInserted += result.inserted;
        totalFetched += result.fetchedCount;
        totalFresh += result.freshCount;
        totalPrefilterAccepted += result.prefilterAcceptedCount;
        totalPrefilterRejected += result.prefilterRejectedCount;
        totalScored += result.scoredCount;
        totalValidated += result.validatedCount;
        totalValidatorRejected += result.validatorRejectedCount;
        totalShowEligible += result.showEligibleCount;

        for (const [reason, count] of Object.entries(
          result.prefilterRejectReasons,
        )) {
          prefilterRejectReasons[reason] =
            (prefilterRejectReasons[reason] ?? 0) + count;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ targetId: target.id, error: message });
      }
    }

    const durationMs = Date.now() - startedAt;

    if (errors.length > 0) {
      console.error("[ingestion:run] Errors:", errors);
    }

    console.log("[ingestion:run] Completed", {
      durationMs,
      durationFormatted: `${(durationMs / 1000).toFixed(1)}s`,
      targetsProcessed: targets.length,
      inserted: totalInserted,
      errors: errors.length,
      fetched: totalFetched,
      fresh: totalFresh,
      prefilterAccepted: totalPrefilterAccepted,
      prefilterRejected: totalPrefilterRejected,
      scored: totalScored,
      validated: totalValidated,
      validatorRejected: totalValidatorRejected,
      showEligible: totalShowEligible,
      prefilterRejectReasons,
    });

    return {
      result: {
        targetsProcessed: targets.length,
        inserted: totalInserted,
        errors: errors.length,
        durationMs,
        fetched: totalFetched,
        fresh: totalFresh,
        prefilterAccepted: totalPrefilterAccepted,
        prefilterRejected: totalPrefilterRejected,
        scored: totalScored,
        validated: totalValidated,
        validatorRejected: totalValidatorRejected,
        showEligible: totalShowEligible,
        prefilterRejectReasons,
      },
    };
  },
});
