import { createServerFn } from "@tanstack/react-start";
import type { Target } from "@/types/global.types";
import { createClient } from "@/lib/supabase/server";

type FetchTargetInput = {
  id: string;
};

const parseTargetInput = (data: unknown): FetchTargetInput => {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid target payload.");
  }

  const payload = data as Record<string, unknown>;
  const id = typeof payload.id === "string" ? payload.id : "";

  if (!id) {
    throw new Error("Target id is required.");
  }

  return { id };
};

export const fetchTarget = createServerFn({ method: "GET" })
  .inputValidator(parseTargetInput)
  .handler(async ({ data }) => {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return null;
    }

    const { data: target, error } = await supabase
      .from("targets")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", userData.user.id)
      .single();

    if (error) {
      return null;
    }

    return target as Target;
  });
