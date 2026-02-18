import { defineTask } from "nitro/task";
import { fetchAllTargets } from "../../../src/backend/targets/fetch-all-targets";
import { ingestTarget } from "../../../src/backend/ingestion/ingest-target";

export type IngestionRunResult = {
  targetsProcessed: number;
  inserted: number;
  errors: number;
  durationMs: number;
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
    const errors: Array<{ targetId: string; error: string }> = [];

    for (const target of targets) {
      try {
        const result = await ingestTarget(target);
        totalInserted += result.inserted;
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
    });

    return {
      result: {
        targetsProcessed: targets.length,
        inserted: totalInserted,
        errors: errors.length,
        durationMs,
      },
    };
  },
});
