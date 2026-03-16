import { createServerClient } from "@supabase/ssr";
import {
  createError,
  defineEventHandler,
  type H3Event,
  parseCookies,
  readBody,
  setCookie,
} from "h3";
import { runTask } from "nitro/task";

import type { Database } from "../../../../types/database.types";
import {
  getIngestionRunById,
  markIngestionRunFailed,
} from "../../../../src/backend/ingestion/ingestion-runs";

interface StartIngestionRunBody {
  runId?: string;
}

function parseRunId(body: unknown): string {
  if (!body || typeof body !== "object") {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing ingestion run payload.",
    });
  }

  const runId = (body as StartIngestionRunBody).runId?.trim();

  if (!runId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing ingestion run id.",
    });
  }

  return runId;
}

export default defineEventHandler(async (event) => {
  if (event.req.headers.get("x-pingbase-internal-request") !== "1") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  const runId = parseRunId(await readBody(event));
  const supabase = createSupabaseClient(event);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const run = await getIngestionRunById(runId);

  if (!run || run.user_id !== userData.user.id) {
    throw createError({
      statusCode: 404,
      statusMessage: "Ingestion run not found.",
    });
  }

  runTask("ingestion:run-scoped", { payload: { runId } }).catch((error) => {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to start ingestion task.";

    void markIngestionRunFailed(runId, message);

    console.error("[api/ingestion/runs/start] Failed to start task:", {
      error,
      runId,
    });
  });

  event.res.status = 202;
  event.res.statusText = "Accepted";

  return {
    runId,
    status: "started",
  };
});

function createSupabaseClient(event: H3Event) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (!url || !key) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase env vars are missing.",
    });
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return Object.entries(parseCookies(event)).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookies) {
        cookies.forEach((cookie) => {
          setCookie(event, cookie.name, cookie.value, cookie.options);
        });
      },
    },
  });
}
