import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@/lib/supabase/server";

type DeleteTargetInput = {
  id: string;
};

const parseTargetInput = (data: unknown): DeleteTargetInput => {
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

export const deleteTarget = createServerFn({ method: "POST" })
  .inputValidator(parseTargetInput)
  .handler(async ({ data }) => {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("You must be logged in to delete a target.");
    }

    const { error } = await supabase
      .from("targets")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userData.user.id);

    if (error) {
      throw new Error(error.message);
    }

    return { id: data.id };
  });
