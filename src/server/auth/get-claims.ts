import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@/lib/supabase/server";

type Claims = Record<string, {}>;

export const getClaims: () => Promise<Claims | null> = createServerFn({
  method: "GET",
}).handler(async () => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data) {
    return null;
  }

  return data.claims;
});
