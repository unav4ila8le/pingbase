import { createServerFn } from "@tanstack/react-start";
import { applyStrictSignalFilters } from "@/backend/signals/strict-signal-filter";
import { createClient } from "@/lib/supabase/server";

export type SignalCounts = Record<string, { new: number; total: number }>;

type FetchCountsInput = {
  targetIds: Array<string>;
};

const parseInput = (data: unknown): FetchCountsInput => {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid payload.");
  }
  const payload = data as Record<string, unknown>;
  const targetIds = Array.isArray(payload.targetIds)
    ? (payload.targetIds as Array<string>).filter(
        (id) => typeof id === "string",
      )
    : [];
  return { targetIds };
};

export const fetchTargetSignalCounts = createServerFn({ method: "GET" })
  .inputValidator(parseInput)
  .handler(async ({ data }): Promise<SignalCounts> => {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return {};
    }

    if (data.targetIds.length === 0) {
      return {};
    }

    const baseQuery = supabase
      .from("signals")
      .select("target_id, status")
      .in("target_id", data.targetIds)
      .eq("user_id", userData.user.id);

    const { data: signals, error } = await applyStrictSignalFilters(baseQuery);

    if (error) {
      throw new Error(error.message);
    }

    const counts: SignalCounts = {};
    for (const id of data.targetIds) {
      counts[id] = { new: 0, total: 0 };
    }
    for (const s of signals ?? []) {
      const row = counts[s.target_id];
      if (row) {
        row.total += 1;
        if (s.status === "new") row.new += 1;
      }
    }
    return counts;
  });
