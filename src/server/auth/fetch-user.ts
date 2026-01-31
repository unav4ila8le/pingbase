import { createServerFn } from "@tanstack/react-start";
import type { Factor, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type SSRSafeUser = User & {
  factors: Array<Factor & { factor_type: "phone" | "totp" }>;
};

export const fetchUser: () => Promise<SSRSafeUser | null> = createServerFn({
  method: "GET",
}).handler(async () => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user as SSRSafeUser;
});
