import { createServerFn } from "@tanstack/react-start";
import type { IngestionRun } from "@/types/global.types";
import { findActiveIngestionRunsByUserId } from "@/backend/ingestion/ingestion-runs";
import { createClient } from "@/lib/supabase/server";

export const fetchActiveIngestionRuns = createServerFn({
  method: "GET",
}).handler(async (): Promise<Array<IngestionRun>> => {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return [];
  }

  return findActiveIngestionRunsByUserId(userData.user.id);
});
