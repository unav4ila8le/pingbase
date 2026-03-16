import { defineTask } from "nitro/task";
import { executeIngestionRun } from "../../../src/backend/ingestion/execute-ingestion-run";
import {
  listIngestionTargetUserIds,
  queueIngestionRun,
} from "../../../src/backend/ingestion/ingestion-runs";

export interface ScheduledIngestionRunResult {
  failed: number;
  queued: number;
  skipped: number;
  usersProcessed: number;
}

export default defineTask({
  meta: {
    name: "ingestion:run",
    description:
      "Queue and execute scoped ingestion runs for all users with targets",
  },
  async run() {
    const userIds = await listIngestionTargetUserIds();
    let queued = 0;
    let skipped = 0;
    let failed = 0;

    for (const userId of userIds) {
      const queuedRun = await queueIngestionRun({
        source: "cron",
        userId,
      });

      if (queuedRun.alreadyRunning) {
        skipped += 1;
        continue;
      }

      queued += 1;

      try {
        await executeIngestionRun(queuedRun.run.id);
      } catch (error) {
        failed += 1;
        console.error("[cron/ingest] Failed queued run", {
          error,
          runId: queuedRun.run.id,
          userId,
        });
      }
    }

    const result: ScheduledIngestionRunResult = {
      failed,
      queued,
      skipped,
      usersProcessed: userIds.length,
    };

    return { result };
  },
});
