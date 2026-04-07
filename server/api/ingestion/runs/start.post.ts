import { createServerClient } from "@supabase/ssr";
import {
  HTTPError,
  defineEventHandler,
  parseCookies,
  readBody,
  setCookie,
} from "h3";
import { runTask } from "nitro/task";

import {
  getIngestionRunById,
  markIngestionRunFailed,
} from "../../../../src/backend/ingestion/ingestion-runs";
import type { H3Event } from "h3";
import type { Database } from "../../../../types/database.types";

interface StartIngestionRunBody {
  runId?: string;
}

function parseRunId(body: unknown): string {
  if (!body || typeof body !== "object") {
    throw new HTTPError({
      status: 400,
      message: "Missing ingestion run payload.",
    });
  }

  const runId = (body as StartIngestionRunBody).runId?.trim();

  if (!runId) {
    throw new HTTPError({
      status: 400,
      message: "Missing ingestion run id.",
    });
  }

  return runId;
}

export default defineEventHandler(async (event) => {
  if (event.req.headers.get("x-pingbase-internal-request") !== "1") {
    throw new HTTPError({
      status: 403,
      message: "Forbidden",
    });
  }

  const runId = parseRunId(await readBody(event));
  const supabase = createSupabaseClient(event);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new HTTPError({
      status: 401,
      message: "Unauthorized",
    });
  }

  const run = await getIngestionRunById(runId);

  if (!run || run.user_id !== userData.user.id) {
    throw new HTTPError({
      status: 404,
      message: "Ingestion run not found.",
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
    throw new HTTPError({
      status: 500,
      message: "Supabase env vars are missing.",
    });
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return Object.entries(parseCookies(event)).flatMap(([name, value]) =>
          typeof value === "string" ? [{ name, value }] : [],
        );
      },
      setAll(cookies) {
        cookies.forEach((cookie) => {
          setCookie(event, cookie.name, cookie.value, cookie.options);
        });
      },
    },
  });
}
