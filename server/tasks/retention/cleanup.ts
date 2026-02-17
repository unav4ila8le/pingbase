import { defineTask } from "nitro/task";
import { createServiceClient } from "../../../src/lib/supabase/service";

const RETENTION_DAYS = 30;

export default defineTask({
  meta: {
    name: "retention:cleanup",
    description: "Delete signals older than 30 days",
  },
  async run() {
    const supabase = createServiceClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
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
