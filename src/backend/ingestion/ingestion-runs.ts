import type { IngestionRunResult } from "@/backend/ingestion/run-ingestion";
import type { Json } from "@/types/database.types";
import type {
  IngestionRun,
  IngestionRunInsert,
  IngestionRunUpdate,
} from "@/types/global.types";
import type { IngestionRunScope } from "@/lib/ingestion-runs";
import {
  ACTIVE_INGESTION_RUN_STATUSES,
  isIngestionRunStale,
} from "@/lib/ingestion-runs";
import { createServiceClient } from "@/lib/supabase/service";

export const INGESTION_RUN_SOURCES = ["manual", "cron"] as const;

export type IngestionRunSource = (typeof INGESTION_RUN_SOURCES)[number];

export interface QueueIngestionRunInput {
  source: IngestionRunSource;
  targetId?: string;
  userId: string;
}

export interface QueueIngestionRunResult {
  run: IngestionRun;
  alreadyRunning: boolean;
}

export async function listIngestionTargetUserIds(): Promise<Array<string>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("targets").select("user_id");

  if (error) {
    throw new Error(`Failed to list ingestion users: ${error.message}`);
  }

  return Array.from(
    new Set((data ?? []).map((row) => row.user_id).filter(Boolean)),
  );
}

export async function findActiveIngestionRunsByUserId(
  userId: string,
): Promise<Array<IngestionRun>> {
  const activeRuns = await listActiveIngestionRunsByUserId(userId);
  const staleRuns = activeRuns.filter((run) => isIngestionRunStale(run));

  if (staleRuns.length === 0) {
    return activeRuns;
  }

  await Promise.all(
    staleRuns.map((run) =>
      markIngestionRunFailed(run.id, buildStaleRunMessage(run)),
    ),
  );

  return listActiveIngestionRunsByUserId(userId);
}

async function listActiveIngestionRunsByUserId(
  userId: string,
): Promise<Array<IngestionRun>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ingestion_runs")
    .select("*")
    .eq("user_id", userId)
    .in("status", [...ACTIVE_INGESTION_RUN_STATUSES])
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch active ingestion runs: ${error.message}`);
  }

  return (data ?? []) as Array<IngestionRun>;
}

export async function getIngestionRunById(
  runId: string,
): Promise<IngestionRun | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ingestion_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch ingestion run: ${error.message}`);
  }

  return (data as IngestionRun | null) ?? null;
}

export async function queueIngestionRun({
  source,
  targetId,
  userId,
}: QueueIngestionRunInput): Promise<QueueIngestionRunResult> {
  const activeRuns = await findActiveIngestionRunsByUserId(userId);
  const overlappingRun = findOverlappingIngestionRun({
    activeRuns,
    targetId,
  });

  if (overlappingRun && isStaleActiveRun(overlappingRun)) {
    await markIngestionRunFailed(
      overlappingRun.id,
      buildStaleRunMessage(overlappingRun),
    );

    const refreshedActiveRuns = await findActiveIngestionRunsByUserId(userId);
    const refreshedOverlap = findOverlappingIngestionRun({
      activeRuns: refreshedActiveRuns,
      targetId,
    });

    if (refreshedOverlap) {
      return {
        run: refreshedOverlap,
        alreadyRunning: true,
      };
    }
  } else if (overlappingRun) {
    return {
      run: overlappingRun,
      alreadyRunning: true,
    };
  }

  const supabase = createServiceClient();
  const values = await buildQueuedRunValues({
    source,
    targetId,
    userId,
  });
  const { data, error } = await supabase
    .from("ingestion_runs")
    .insert(values)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const currentActiveRuns = await findActiveIngestionRunsByUserId(userId);
      const existingRun = findOverlappingIngestionRun({
        activeRuns: currentActiveRuns,
        targetId,
      });
      if (existingRun) {
        return {
          run: existingRun,
          alreadyRunning: true,
        };
      }
    }

    throw new Error(`Failed to queue ingestion run: ${error.message}`);
  }

  return {
    run: data as IngestionRun,
    alreadyRunning: false,
  };
}

export async function markIngestionRunRunning(
  runId: string,
): Promise<IngestionRun | null> {
  const supabase = createServiceClient();
  const updates: IngestionRunUpdate = {
    error_message: null,
    started_at: new Date().toISOString(),
    status: "running",
  };
  const { data, error } = await supabase
    .from("ingestion_runs")
    .update(updates)
    .eq("id", runId)
    .eq("status", "queued")
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to mark ingestion run as running: ${error.message}`,
    );
  }

  return (data as IngestionRun | null) ?? null;
}

export async function heartbeatIngestionRun(runId: string): Promise<void> {
  const supabase = createServiceClient();
  const updates: IngestionRunUpdate = {
    status: "running",
  };
  const { error } = await supabase
    .from("ingestion_runs")
    .update(updates)
    .eq("id", runId)
    .eq("status", "running");

  if (error) {
    throw new Error(`Failed to heartbeat ingestion run: ${error.message}`);
  }
}

export async function markIngestionRunSucceeded(
  runId: string,
  result: IngestionRunResult,
): Promise<void> {
  await finishIngestionRun({
    runId,
    status: "succeeded",
    result,
  });
}

export async function markIngestionRunFailed(
  runId: string,
  errorMessage: string,
): Promise<void> {
  await finishIngestionRun({
    errorMessage,
    runId,
    status: "failed",
  });
}

async function fetchUserTargetIds(userId: string): Promise<Array<string>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("targets")
    .select("id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to list targets for ingestion: ${error.message}`);
  }

  return (data ?? []).map((target) => target.id);
}

async function fetchTargetIds(
  userId: string,
  targetId: string,
): Promise<Array<string>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("targets")
    .select("id")
    .eq("id", targetId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to load target for ingestion: ${error.message}`);
  }

  return (data ?? []).map((target) => target.id);
}

interface FinishIngestionRunInput {
  errorMessage?: string;
  result?: IngestionRunResult;
  runId: string;
  status: "failed" | "succeeded";
}

async function finishIngestionRun({
  errorMessage,
  result,
  runId,
  status,
}: FinishIngestionRunInput): Promise<void> {
  const supabase = createServiceClient();
  const updates: IngestionRunUpdate = {
    completed_target_count: result?.targetsProcessed ?? 0,
    error_message: errorMessage ?? null,
    error_target_count: result?.errors ?? 0,
    finished_at: new Date().toISOString(),
    result: (result ?? null) as Json,
    status,
  };
  const { error } = await supabase
    .from("ingestion_runs")
    .update(updates)
    .eq("id", runId);

  if (error) {
    throw new Error(`Failed to finish ingestion run: ${error.message}`);
  }
}

interface BuildQueuedRunValuesInput {
  source: IngestionRunSource;
  targetId?: string;
  userId: string;
}

async function buildQueuedRunValues({
  source,
  targetId,
  userId,
}: BuildQueuedRunValuesInput): Promise<IngestionRunInsert> {
  if (targetId) {
    const targetIds = await fetchTargetIds(userId, targetId);

    if (targetIds.length === 0) {
      throw new Error("Target not found.");
    }

    return {
      completed_target_count: 0,
      error_message: null,
      error_target_count: 0,
      finished_at: null,
      result: null,
      scope: "target",
      source,
      started_at: null,
      status: "queued",
      target_count: targetIds.length,
      target_id: targetId,
      target_ids: targetIds,
      user_id: userId,
    };
  }

  const targetIds = await fetchUserTargetIds(userId);

  if (targetIds.length === 0) {
    throw new Error("Create at least one target before running ingestion.");
  }

  return {
    completed_target_count: 0,
    error_message: null,
    error_target_count: 0,
    finished_at: null,
    result: null,
    scope: "all_targets",
    source,
    started_at: null,
    status: "queued",
    target_count: targetIds.length,
    target_id: null,
    target_ids: targetIds,
    user_id: userId,
  };
}

interface FindOverlappingIngestionRunInput {
  activeRuns: Array<IngestionRun>;
  targetId?: string;
}

function findOverlappingIngestionRun({
  activeRuns,
  targetId,
}: FindOverlappingIngestionRunInput): IngestionRun | null {
  const scope: IngestionRunScope = targetId ? "target" : "all_targets";

  if (scope === "all_targets") {
    return activeRuns[0] ?? null;
  }

  return (
    activeRuns.find(
      (run) => run.scope === "all_targets" || run.target_id === targetId,
    ) ?? null
  );
}

function isStaleActiveRun(run: IngestionRun): boolean {
  return isIngestionRunStale(run);
}

function buildStaleRunMessage(run: IngestionRun): string {
  if (run.status === "queued") {
    return "Ingestion run was queued but never started.";
  }

  return "Ingestion run stopped heartbeating and was marked failed.";
}
