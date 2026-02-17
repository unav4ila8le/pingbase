import type { IngestionTarget } from "@/server/ingestion/types";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Fetches all targets across all users. Uses service role to bypass RLS.
 * Only for use by Nitro cron tasks (ingestion, retention).
 */
export async function fetchAllTargets(): Promise<Array<IngestionTarget>> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("targets")
    .select("*");

  if (error) {
    throw new Error(`Failed to fetch targets: ${error.message}`);
  }

  return (data ?? []) as Array<IngestionTarget>;
}
