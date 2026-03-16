import type { IngestionRun } from "@/types/global.types";

export const ACTIVE_INGESTION_RUN_STATUSES = ["queued", "running"] as const;
export const INGESTION_RUN_SCOPES = ["all_targets", "target"] as const;
export const INGESTION_RUN_HEARTBEAT_INTERVAL_MS = 5_000;
export const STALE_QUEUED_INGESTION_RUN_MS = 15_000;
export const STALE_RUNNING_INGESTION_RUN_MS = 20_000;

export type IngestionRunScope = (typeof INGESTION_RUN_SCOPES)[number];

export function isIngestionRunActive(
  status: IngestionRun["status"] | null | undefined,
): boolean {
  return (
    status != null &&
    ACTIVE_INGESTION_RUN_STATUSES.includes(
      status as (typeof ACTIVE_INGESTION_RUN_STATUSES)[number],
    )
  );
}

export function isIngestionRunStale(
  run: IngestionRun,
  now = Date.now(),
): boolean {
  if (run.status === "queued" && run.started_at == null) {
    return (
      now - new Date(run.created_at).getTime() > STALE_QUEUED_INGESTION_RUN_MS
    );
  }

  if (run.status !== "running") {
    return false;
  }

  return (
    now - new Date(run.updated_at).getTime() > STALE_RUNNING_INGESTION_RUN_MS
  );
}
