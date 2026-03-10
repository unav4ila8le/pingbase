import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Logout01Icon, PlayIcon } from "@hugeicons/core-free-icons";

import type { Target } from "@/types/global.types";
import { triggerIngestion } from "@/backend/ingestion/trigger-ingestion";
import { logOut } from "@/backend/auth/log-out";
import { fetchTargetSignalCounts } from "@/backend/signals/fetch-target-signal-counts";
import { fetchTargets } from "@/backend/targets/fetch-targets";
import { TargetCard } from "@/components/dashboard/targets/target-card";
import { TargetDialog } from "@/components/dashboard/targets/target-dialog";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

type IngestionStatus = "idle" | "running" | "success" | "error";

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
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isIngestionRunning, setIsIngestionRunning] = useState(false);
  const [targetIngestionStatuses, setTargetIngestionStatuses] = useState<
    Record<string, IngestionStatus>
  >({});
  const [targets, setTargets] = useState<Array<Target>>(data.targets);

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
    if (isIngestionRunning) {
      return;
    }

    const runTargetIds = targets.map((target) => target.id);
    if (runTargetIds.length === 0) {
      return;
    }

    setIsIngestionRunning(true);
    setTargetIngestionStatuses((prev) => {
      const next = { ...prev };
      for (const targetId of runTargetIds) {
        next[targetId] = "running";
      }
      return next;
    });

    try {
      const result = await triggerIngestion({ data: {} });

      const errorTargetIds = new Set(result.errorTargetIds);
      setTargetIngestionStatuses((prev) => {
        const next = { ...prev };
        for (const targetId of result.processedTargetIds) {
          next[targetId] = errorTargetIds.has(targetId) ? "error" : "success";
        }
        return next;
      });

      if (result.errors > 0) {
        toast.error("Ingestion finished with issues", {
          description: `${result.showEligible} eligible signal(s) ready to review. ${result.errors} target(s) failed.`,
        });
      } else {
        toast.success("Ingestion completed", {
          description:
            result.showEligible > 0
              ? `${result.showEligible} eligible signal(s) ready to review.`
              : "No new eligible signals found.",
        });
      }
    } catch (err: unknown) {
      setTargetIngestionStatuses((prev) => {
        const next = { ...prev };
        for (const targetId of runTargetIds) {
          next[targetId] = "error";
        }
        return next;
      });
      toast.error("Ingestion failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsIngestionRunning(false);
    }
  };

  const hasTargets = useMemo(() => targets.length > 0, [targets.length]);

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
            disabled={isIngestionRunning || !hasTargets}
            variant="outline"
          >
            {isIngestionRunning ? (
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
              ingestionStatus={targetIngestionStatuses[target.id] ?? "idle"}
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
