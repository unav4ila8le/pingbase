import { createServerFn } from "@tanstack/react-start";
import type { Target } from "@/types/global.types";
import { createClient } from "@/lib/supabase/server";

export const fetchTargets: () => Promise<Array<Target>> = createServerFn({
  method: "GET",
}).handler(async () => {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return [];
  }

  const { data, error } = await supabase
    .from("targets")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
});
