import { defineEventHandler } from "h3";
import { runTask } from "nitro/task";

/**
 * Manually trigger the ingestion task.
 * Use when Nitro's /_nitro/tasks/:name endpoint returns 404 (e.g. TanStack Start dev server).
 *
 * curl -X POST http://localhost:3000/api/cron/ingest
 */
export default defineEventHandler(async () => {
  const result = await runTask("ingestion:run", { payload: {} });
  return result;
});
