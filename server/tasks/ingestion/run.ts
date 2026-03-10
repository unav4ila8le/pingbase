import { defineTask } from "nitro/task";
import { runIngestion } from "../../../src/backend/ingestion/run-ingestion";
import type { IngestionRunResult } from "../../../src/backend/ingestion/run-ingestion";

export type { IngestionRunResult };

export default defineTask({
  meta: {
    name: "ingestion:run",
    description:
      "Fetch all targets, ingest Reddit signals, score with LLM, and persist",
  },
  async run() {
    const result = await runIngestion({ mode: "all" });

    return {
      result,
    };
  },
});
