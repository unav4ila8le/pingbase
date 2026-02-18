import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@/lib/supabase/server";

export const logOut = createServerFn({
  method: "POST",
}).handler(async () => {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
});
