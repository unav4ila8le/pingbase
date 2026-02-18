import { createServiceClient } from "@/lib/supabase/service";

/**
 * Updates the target's last_scanned_at to now().
 * Used after each successful ingestion run to limit future scans to posts newer than this.
 * Service client required (cron context, no user session).
 */
export async function updateTargetLastScannedAt(
  targetId: string,
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("targets")
    .update({ last_scanned_at: new Date().toISOString() })
    .eq("id", targetId);

  if (error) {
    throw new Error(`Failed to update last_scanned_at: ${error.message}`);
  }
}
