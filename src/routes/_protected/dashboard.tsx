import {
  createFileRoute,
  getRouteApi,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Logout01Icon, PlayIcon } from "@hugeicons/core-free-icons";

import type { Target } from "@/types/global.types";
import { logOut } from "@/backend/auth/log-out";
import { startIngestionRun } from "@/backend/ingestion/start-ingestion-run";
import { fetchTargetSignalCounts } from "@/backend/signals/fetch-target-signal-counts";
import { fetchTargets } from "@/backend/targets/fetch-targets";
import { TargetCard } from "@/components/dashboard/targets/target-card";
import { TargetDialog } from "@/components/dashboard/targets/target-dialog";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { isIngestionRunActive } from "@/lib/ingestion-runs";

type IngestionStatus = "idle" | "running" | "success" | "error";
const protectedRoute = getRouteApi("/_protected");

export const Route = createFileRoute("/_protected/dashboard")({
  component: Dashboard,
  loader: async ({ context }) => {
    const targets = await fetchTargets();
    const targetIds = targets.map((t) => t.id);
    const counts =
      targetIds.length > 0
        ? await fetchTargetSignalCounts({ data: { targetIds } })
        : {};
    return {
      user: context.user,
      targets,
      signalCounts: counts,
    };
  },
});

function Dashboard() {
  const data = Route.useLoaderData();
  const { activeIngestionRuns } = protectedRoute.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isStartingAllTargetsIngestion, setIsStartingAllTargetsIngestion] =
    useState(false);
  const [startingTargetIds, setStartingTargetIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [targets, setTargets] = useState<Array<Target>>(data.targets);
  const hasTargets = targets.length > 0;
  const activeRuns = useMemo(
    () => activeIngestionRuns.filter((run) => isIngestionRunActive(run.status)),
    [activeIngestionRuns],
  );
  const isAllTargetsRunActive = activeRuns.some(
    (run) => run.scope === "all_targets",
  );
  const runningTargetIds = useMemo(() => {
    const runningIds = new Set<string>();

    for (const run of activeRuns) {
      for (const targetId of run.target_ids) {
        runningIds.add(targetId);
      }
    }

    return runningIds;
  }, [activeRuns]);
  const optimisticRunningTargetIds = useMemo(() => {
    const runningIds = new Set(runningTargetIds);

    if (isStartingAllTargetsIngestion) {
      for (const target of targets) {
        runningIds.add(target.id);
      }
    }

    for (const targetId of startingTargetIds) {
      runningIds.add(targetId);
    }

    return runningIds;
  }, [isStartingAllTargetsIngestion, runningTargetIds, startingTargetIds, targets]);
  const isStartingAnyTargetIngestion = startingTargetIds.size > 0;
  const areAllTargetsRunning =
    hasTargets &&
    targets.every((target) => optimisticRunningTargetIds.has(target.id));

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
      toast.success("You have been logged out");
      await navigate({ to: "/" });
    } catch (err: unknown) {
      toast.error("Logout failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRunIngestion = async () => {
    if (
      isStartingAllTargetsIngestion ||
      isStartingAnyTargetIngestion ||
      isAllTargetsRunActive ||
      areAllTargetsRunning
    ) {
      return;
    }

    if (targets.length === 0) {
      return;
    }

    setIsStartingAllTargetsIngestion(true);
    try {
      const result = await startIngestionRun({ data: {} });
      await router.invalidate();

      if (result.alreadyRunning) {
        toast("Ingestion is already running.");
      } else {
        toast.success("Ingestion started", {
          description:
            "Processing continues in the background. You can leave this page and come back later.",
        });
      }
    } catch (err: unknown) {
      toast.error("Ingestion failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsStartingAllTargetsIngestion(false);
    }
  };

  const handleRunTargetIngestion = async (targetId: string) => {
    if (
      isStartingAllTargetsIngestion ||
      startingTargetIds.has(targetId) ||
      optimisticRunningTargetIds.has(targetId)
    ) {
      return;
    }

    setStartingTargetIds((prev) => {
      const next = new Set(prev);
      next.add(targetId);
      return next;
    });

    try {
      const result = await startIngestionRun({ data: { targetId } });
      await router.invalidate();

      if (result.alreadyRunning) {
        toast("Ingestion is already running for this target.");
      } else {
        toast.success("Target ingestion started", {
          description:
            "Processing continues in the background. You can leave this page and come back later.",
        });
      }
    } catch (err: unknown) {
      toast.error("Target ingestion failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setStartingTargetIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Targets</h1>
          <p className="text-muted-foreground text-sm">
            Track conversations that matter to your product or brand.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleRunIngestion}
            disabled={
              isStartingAllTargetsIngestion ||
              isStartingAnyTargetIngestion ||
              areAllTargetsRunning ||
              !hasTargets
            }
            variant="outline"
          >
            {isStartingAllTargetsIngestion ||
            isAllTargetsRunActive ||
            areAllTargetsRunning ? (
              <>
                <Spinner /> Running ingestion...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={PlayIcon} />
                Run ingestion
              </>
            )}
          </Button>
          <TargetDialog
            mode="create"
            onSuccess={(target) => setTargets((prev) => [target, ...prev])}
            trigger={
              <DialogTrigger
                render={
                  <Button>
                    <HugeiconsIcon icon={Add01Icon} />
                    New target
                  </Button>
                }
              >
                New target
              </DialogTrigger>
            }
          />
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="destructive"
          >
            {isLoggingOut ? (
              <>
                <Spinner /> Logging out...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Logout01Icon} />
                Logout
              </>
            )}
          </Button>
        </div>
      </div>

      {!hasTargets ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No targets yet. Create your first one to start tracking signals.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {targets.map((target) => (
            <TargetCard
              key={target.id}
              target={target}
              signalCounts={data.signalCounts[target.id]}
              ingestionStatus={
                (optimisticRunningTargetIds.has(target.id)
                  ? "running"
                  : "idle") as IngestionStatus
              }
              isRunIngestionDisabled={
                isStartingAllTargetsIngestion ||
                optimisticRunningTargetIds.has(target.id)
              }
              onRunIngestion={handleRunTargetIngestion}
              onUpdated={(updated) =>
                setTargets((prev) =>
                  prev.map((item) => (item.id === updated.id ? updated : item)),
                )
              }
              onDeleted={(targetId) =>
                setTargets((prev) =>
                  prev.filter((item) => item.id !== targetId),
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
