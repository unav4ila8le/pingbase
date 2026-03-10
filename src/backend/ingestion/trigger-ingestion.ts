import { createServerFn } from "@tanstack/react-start";
import type { IngestionRunResult } from "@/backend/ingestion/run-ingestion";
import { runIngestion } from "@/backend/ingestion/run-ingestion";
import { createClient } from "@/lib/supabase/server";

type TriggerIngestionInput = {
  targetId?: string;
};

const parseTriggerInput = (data: unknown): TriggerIngestionInput => {
  if (data == null) {
    return {};
  }

  if (typeof data !== "object") {
    throw new Error("Invalid ingestion payload.");
  }

  const payload = data as Record<string, unknown>;
  const targetId =
    typeof payload.targetId === "string" ? payload.targetId.trim() : "";

  if (!targetId) {
    return {};
  }

  return { targetId };
};

export const triggerIngestion = createServerFn({ method: "POST" })
  .inputValidator(parseTriggerInput)
  .handler(async ({ data }): Promise<IngestionRunResult> => {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("You must be logged in to run ingestion.");
    }

    if (data.targetId) {
      const result = await runIngestion({
        mode: "target",
        userId: userData.user.id,
        targetId: data.targetId,
      });

      if (result.targetsProcessed === 0) {
        throw new Error("Target not found.");
      }

      return result;
    }

    return runIngestion({
      mode: "user",
      userId: userData.user.id,
    });
  });
