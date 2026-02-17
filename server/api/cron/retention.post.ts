import { defineEventHandler } from "h3";
import { runTask } from "nitro/task";

/**
 * Manually trigger the retention cleanup task.
 * Use when Nitro's /_nitro/tasks/:name endpoint returns 404 (e.g. TanStack Start dev server).
 *
 * curl -X POST http://localhost:3000/api/cron/retention
 */
export default defineEventHandler(async () => {
  const result = await runTask("retention:cleanup", { payload: {} });
  return result;
});
