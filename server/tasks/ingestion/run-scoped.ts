import { defineTask } from "nitro/task";
import { executeIngestionRun } from "../../../src/backend/ingestion/execute-ingestion-run";

interface IngestionRunTaskPayload {
  runId?: string;
}

function parsePayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    throw new Error("Missing ingestion task payload.");
  }

  const runId = (payload as IngestionRunTaskPayload).runId?.trim();

  if (!runId) {
    throw new Error("Missing ingestion run id.");
  }

  return runId;
}

export default defineTask({
  meta: {
    name: "ingestion:run-scoped",
    description:
      "Execute a queued ingestion run for all targets or one target.",
  },
  async run({ payload }) {
    const runId = parsePayload(payload);
    const result = await executeIngestionRun(runId);

    return {
      result,
      runId,
    };
  },
});
