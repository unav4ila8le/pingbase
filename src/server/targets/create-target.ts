import { createServerFn } from "@tanstack/react-start";
import type { Target } from "@/types/global.types";
import { createClient } from "@/lib/supabase/server";

type CreateTargetInput = {
  name: string;
  description: string;
  keywords?: Array<string>;
  exclusions?: Array<string>;
};

const parseTargetInput = (data: unknown): CreateTargetInput => {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid target payload.");
  }

  const payload = data as Record<string, unknown>;
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

  if (!name || !description) {
    throw new Error("Name and description are required.");
  }

  return {
    name,
    description,
    keywords,
    exclusions,
  };
};

export const createTarget = createServerFn({ method: "POST" })
  .inputValidator(parseTargetInput)
  .handler(async ({ data }) => {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("You must be logged in to create a target.");
    }

    const { data: target, error } = await supabase
      .from("targets")
      .insert({
        user_id: userData.user.id,
        name: data.name,
        description: data.description,
        keywords: data.keywords ?? [],
        exclusions: data.exclusions ?? [],
        url: null,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return target as Target;
  });
