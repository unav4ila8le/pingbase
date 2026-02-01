import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import type { Target } from "@/types/global.types";
import { TargetCard } from "@/components/targets/target-card";
import { TargetDialog } from "@/components/targets/target-dialog";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { fetchTargets } from "@/server/targets/fetch-targets";
import { logOut } from "@/server/auth/log-out";

export const Route = createFileRoute("/_protected/dashboard")({
  component: Dashboard,
  loader: async ({ context }) => {
    const targets = await fetchTargets();
    return {
      user: context.user,
      targets,
    };
  },
});

function Dashboard() {
  const data = Route.useLoaderData();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [targets, setTargets] = useState<Array<Target>>(data.targets);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
      await navigate({ to: "/" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const hasTargets = useMemo(() => targets.length > 0, [targets.length]);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Targets</h1>
          <p className="text-muted-foreground text-sm">
            Track conversations that matter to your product or brand.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TargetDialog
            mode="create"
            onSuccess={(target) => setTargets((prev) => [target, ...prev])}
            trigger={
              <DialogTrigger render={<Button />}>New target</DialogTrigger>
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
              "Logout"
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
