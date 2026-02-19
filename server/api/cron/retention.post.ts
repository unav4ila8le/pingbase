import { defineEventHandler } from "h3";
import { runTask } from "nitro/task";

/**
 * Manually trigger the retention cleanup task.
 * Use when Nitro's /_nitro/tasks/:name endpoint returns 404 (e.g. TanStack Start dev server).
 *
 * Protected by CRON_SECRET. Set in env and pass via header:
 *   curl -X POST http://localhost:3000/api/cron/retention \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
export default defineEventHandler(async (event) => {
  const authHeader = event.req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    event.res.status = 401;
    event.res.statusText = "Unauthorized";
    return "Unauthorized";
  }

  const result = await runTask("retention:cleanup", { payload: {} });
  return result;
});
