import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestUrl } from "@tanstack/react-start/server";
import {
  markIngestionRunFailed,
  queueIngestionRun,
} from "@/backend/ingestion/ingestion-runs";
import { createClient } from "@/lib/supabase/server";

export interface StartIngestionRunInput {
  targetId?: string;
}

export interface StartIngestionRunResult {
  alreadyRunning: boolean;
  runId: string;
}

const parseStartIngestionRunInput = (data: unknown): StartIngestionRunInput => {
  if (data == null) {
    return {};
  }

  if (typeof data !== "object") {
    throw new Error("Invalid ingestion payload.");
  }

  const payload = data as Record<string, unknown>;
  const targetId =
    typeof payload.targetId === "string" ? payload.targetId.trim() : "";

  return targetId ? { targetId } : {};
};

export const startIngestionRun = createServerFn({ method: "POST" })
  .inputValidator(parseStartIngestionRunInput)
  .handler(async ({ data }): Promise<StartIngestionRunResult> => {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("You must be logged in to run ingestion.");
    }

    const queuedRun = await queueIngestionRun({
      source: "manual",
      targetId: data.targetId,
      userId: userData.user.id,
    });

    if (!queuedRun.alreadyRunning) {
      try {
        await triggerIngestionRunTask(queuedRun.run.id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to start ingestion.";

        await markIngestionRunFailed(queuedRun.run.id, message);

        console.error("[ingestion:start] Failed to start ingestion task:", {
          error,
          runId: queuedRun.run.id,
        });

        throw new Error(message);
      }
    }

    return {
      alreadyRunning: queuedRun.alreadyRunning,
      runId: queuedRun.run.id,
    };
  });

async function triggerIngestionRunTask(runId: string): Promise<void> {
  const cookieHeader = getRequestHeader("cookie");
  const requestUrl = getRequestUrl();
  const endpoint = new URL("/api/ingestion/runs/start", requestUrl);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-pingbase-internal-request": "1",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({ runId }),
  });

  if (response.ok) {
    return;
  }

  const description = await response.text();
  throw new Error(
    description || `Failed to start ingestion task (${response.status}).`,
  );
}
