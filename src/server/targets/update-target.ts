import { createServerFn } from "@tanstack/react-start";
import type { Target } from "@/types/global.types";
import { createClient } from "@/lib/supabase/server";

type UpdateTargetInput = {
  id: string;
  name: string;
  description: string;
  keywords?: Array<string>;
  exclusions?: Array<string>;
};

const parseTargetInput = (data: unknown): UpdateTargetInput => {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid target payload.");
  }

  const payload = data as Record<string, unknown>;
  const id = typeof payload.id === "string" ? payload.id : "";
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const keywords = Array.isArray(payload.keywords)
    ? payload.keywords
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const exclusions = Array.isArray(payload.exclusions)
    ? payload.exclusions
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  if (!id || !name || !description) {
    throw new Error("Id, name, and description are required.");
  }

  return {
    id,
    name,
    description,
    keywords,
    exclusions,
  };
};

export const updateTarget = createServerFn({ method: "POST" })
  .inputValidator(parseTargetInput)
  .handler(async ({ data }) => {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("You must be logged in to update a target.");
    }

    const { data: target, error } = await supabase
      .from("targets")
      .update({
        name: data.name,
        description: data.description,
        keywords: data.keywords ?? [],
        exclusions: data.exclusions ?? [],
        url: null,
      })
      .eq("id", data.id)
      .eq("user_id", userData.user.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return target as Target;
  });
