import { defineTask } from "nitro/task";
import { fetchAllTargets } from "../../../src/server/targets/fetch-all-targets";
import { ingestTarget } from "../../../src/server/ingestion/ingest-target";

export default defineTask({
  meta: {
    name: "ingestion:run",
    description:
      "Fetch all targets, ingest Reddit signals, score with LLM, and persist",
  },
  async run() {
    const targets = await fetchAllTargets();
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

    if (errors.length > 0) {
      console.error("[ingestion:run] Errors:", errors);
    }

    return {
      result: {
        targetsProcessed: targets.length,
        inserted: totalInserted,
        errors: errors.length,
      },
    };
  },
});
