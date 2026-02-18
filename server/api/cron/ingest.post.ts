import { defineEventHandler } from "h3";
import { runTask } from "nitro/task";

import type { IngestionRunResult } from "../../tasks/ingestion/run";

/**
 * Manually trigger the ingestion task.
 * Use when Nitro's /_nitro/tasks/:name endpoint returns 404 (e.g. TanStack Start dev server).
 *
 * Returns 202 immediately and runs ingestion in background (avoids Nitro dev middleware
 * timeouts when ingestion runs for minutes).
 *
 * curl -X POST http://localhost:3000/api/cron/ingest
 */
export default defineEventHandler((event) => {
  console.log("[cron/ingest] Ingestion cron triggered, running in background");

  runTask("ingestion:run", { payload: {} })
    .then((result) => {
      const r = result?.result as IngestionRunResult | undefined;
      const duration =
        r?.durationMs != null ? `${(r.durationMs / 1000).toFixed(1)}s` : "?";
      console.log("[cron/ingest] Done:", {
        ...r,
        durationFormatted: duration,
      });
    })
    .catch((err) => console.error("[cron/ingest] Error:", err));

  event.res.status = 202;
  event.res.statusText = "Accepted";
  return {
    status: "started",
    message: "Ingestion running in background. Check server logs for result.",
  };
});
