import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Supabase client with service role key. Bypasses RLS.
 * Use ONLY for server-side cron/background jobs (e.g. ingestion, retention).
 * Never expose or use in client code (per AGENTS.md).
 */
export function createServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_OR_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or SUPABASE_SECRET_OR_SERVICE_ROLE_KEY for service client",
    );
  }

  return createClient<Database>(url, key);
}
