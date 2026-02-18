import { defineTask } from "nitro/task";
import { createServiceClient } from "../../../src/lib/supabase/service";
import { RETENTION_KNOBS } from "../../../src/backend/config/knobs";

export default defineTask({
  meta: {
    name: "retention:cleanup",
    description: `Delete signals older than ${RETENTION_KNOBS.signalRetentionDays} days`,
  },
  async run() {
    const supabase = createServiceClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_KNOBS.signalRetentionDays);
    const cutoffIso = cutoff.toISOString();

    const { data, error } = await supabase
      .from("signals")
      .delete()
      .lt("date_posted", cutoffIso)
      .select("id");

    if (error) {
      throw new Error(`Retention cleanup failed: ${error.message}`);
    }

    return {
      result: {
        deleted: data?.length ?? 0,
        cutoff: cutoffIso,
      },
    };
  },
});
