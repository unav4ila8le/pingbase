import type { IngestionRunResult } from "@/backend/ingestion/run-ingestion";
import {
  heartbeatIngestionRun,
  getIngestionRunById,
  markIngestionRunFailed,
  markIngestionRunRunning,
  markIngestionRunSucceeded,
} from "@/backend/ingestion/ingestion-runs";
import { runIngestion } from "@/backend/ingestion/run-ingestion";
import { INGESTION_RUN_HEARTBEAT_INTERVAL_MS } from "@/lib/ingestion-runs";

export async function executeIngestionRun(
  runId: string,
): Promise<IngestionRunResult | null> {
  const run = await getIngestionRunById(runId);

  if (!run) {
    throw new Error("Ingestion run not found.");
  }

  if (run.status === "succeeded") {
    return (run.result as IngestionRunResult | null) ?? null;
  }

  if (run.status === "failed") {
    return null;
  }

  const runningRun =
    run.status === "running" ? run : await markIngestionRunRunning(run.id);

  if (!runningRun) {
    return null;
  }

  const heartbeatTimer = setInterval(() => {
    void heartbeatIngestionRun(runningRun.id).catch((error) => {
      console.error("[ingestion:heartbeat] Failed to update run heartbeat:", {
        error,
        runId: runningRun.id,
      });
    });
  }, INGESTION_RUN_HEARTBEAT_INTERVAL_MS);

  try {
    const result =
      runningRun.scope === "target" && runningRun.target_id
        ? await runIngestion({
            mode: "target",
            targetId: runningRun.target_id,
            userId: runningRun.user_id,
          })
        : await runIngestion({
            mode: "user",
            userId: runningRun.user_id,
          });

    await markIngestionRunSucceeded(runningRun.id, result);

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markIngestionRunFailed(runningRun.id, message);
    throw error;
  } finally {
    clearInterval(heartbeatTimer);
  }
}
