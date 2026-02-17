import { defineEventHandler } from "h3";
import { runTask } from "nitro/task";

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
  runTask("ingestion:run", { payload: {} })
    .then((result) => console.log("[cron/ingest] Done:", result))
    .catch((err) => console.error("[cron/ingest] Error:", err));

  event.res.status = 202;
  event.res.statusText = "Accepted";
  return {
    status: "started",
    message: "Ingestion running in background. Check server logs for result.",
  };
});
