import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { signalColumns } from "@/components/dashboard/signals/table/signal-columns";
import { DataTable } from "@/components/ui/custom/data-table";
import { buttonVariants } from "@/components/ui/button";
import { fetchTarget } from "@/server/targets/fetch-target";
import { fetchTargetSignals } from "@/server/signals/fetch-target-signals";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_protected/targets/$targetId")({
  loader: async ({ params }) => {
    const target = await fetchTarget({ data: { id: params.targetId } });

    if (!target) {
      throw redirect({ to: "/dashboard" });
    }

    const signals = await fetchTargetSignals({
      data: { targetId: params.targetId },
    });

    return { target, signals };
  },
  component: TargetDetail,
});

function TargetDetail() {
  const { target, signals } = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          to="/dashboard"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "cursor-default",
          )}
        >
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{target.name}</h1>
          <p className="text-muted-foreground text-sm">{target.description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Signals</div>
        <DataTable columns={signalColumns} data={signals} />
      </div>
    </div>
  );
}
