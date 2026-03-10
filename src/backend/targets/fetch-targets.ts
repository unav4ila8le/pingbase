import { createServerFn } from "@tanstack/react-start";
import type { IngestionTarget } from "@/backend/ingestion/types";
import type { Target } from "@/types/global.types";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export type TargetFetchScope =
  | {
      mode: "all";
    }
  | {
      mode: "user";
      userId: string;
    }
  | {
      mode: "target";
      userId: string;
      targetId: string;
    };

type FetchTargetsInput = {
  targetId?: string;
};

const parseFetchTargetsInput = (data: unknown): FetchTargetsInput => {
  if (data == null) {
    return {};
  }

  if (typeof data !== "object") {
    throw new Error("Invalid targets payload.");
  }

  const payload = data as Record<string, unknown>;
  const targetId =
    typeof payload.targetId === "string" ? payload.targetId.trim() : "";

  if (!targetId) {
    return {};
  }

  return { targetId };
};

export async function fetchTargetsByScope(
  scope: TargetFetchScope,
): Promise<Array<IngestionTarget>> {
  const supabase = createServiceClient();

  let query = supabase.from("targets").select("*");

  if (scope.mode !== "all") {
    query = query.eq("user_id", scope.userId);
  }

  if (scope.mode === "target") {
    query = query.eq("id", scope.targetId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch targets: ${error.message}`);
  }

  return (data ?? []) as Array<IngestionTarget>;
}

export const fetchTargets = createServerFn({ method: "GET" })
  .inputValidator(parseFetchTargetsInput)
  .handler(async ({ data }): Promise<Array<Target>> => {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return [];
    }

    const scope: TargetFetchScope = data.targetId
      ? {
          mode: "target",
          userId: userData.user.id,
          targetId: data.targetId,
        }
      : {
          mode: "user",
          userId: userData.user.id,
        };

    return (await fetchTargetsByScope(scope)) as Array<Target>;
  });
