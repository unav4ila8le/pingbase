import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@/lib/supabase/server";

type MarkTargetSignalsSeenInput = {
  targetId: string;
};

const parseInput = (data: unknown): MarkTargetSignalsSeenInput => {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid payload.");
  }

  const payload = data as Record<string, unknown>;
  const targetId =
    typeof payload.targetId === "string" ? payload.targetId.trim() : "";

  if (!targetId) {
    throw new Error("Target id is required.");
  }

  return { targetId };
};

export const markTargetSignalsSeen = createServerFn({ method: "POST" })
  .inputValidator(parseInput)
  .handler(async ({ data }) => {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("You must be logged in to update signal status.");
    }

    const { data: updatedSignals, error } = await supabase
      .from("signals")
      .update({ status: "seen" })
      .eq("target_id", data.targetId)
      .eq("user_id", userData.user.id)
      .eq("status", "new")
      .select("id");

    if (error) {
      throw new Error(error.message);
    }

    return { updated: updatedSignals?.length ?? 0 };
  });
