import { createServerFn } from "@tanstack/react-start";
import type { SignalSummary } from "@/types/global.types";
import { createClient } from "@/lib/supabase/server";

type FetchSignalsInput = {
  targetId: string;
};

const parseSignalsInput = (data: unknown): FetchSignalsInput => {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid signals payload.");
  }

  const payload = data as Record<string, unknown>;
  const targetId = typeof payload.targetId === "string" ? payload.targetId : "";

  if (!targetId) {
    throw new Error("Target id is required.");
  }

  return { targetId };
};

export const fetchTargetSignals = createServerFn({ method: "GET" })
  .inputValidator(parseSignalsInput)
  .handler(async ({ data }) => {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return [];
    }

    const { data: signals, error } = await supabase
      .from("signals")
      .select(
        "id, platform, type, community, title, content_excerpt, score, reason, url, status, date_posted",
      )
      .eq("target_id", data.targetId)
      .eq("user_id", userData.user.id)
      .order("date_posted", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (signals ?? []) as Array<SignalSummary>;
  });
