import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { fetchTarget } from "@/server/targets/fetch-target";
import { fetchTargetSignals } from "@/server/signals/fetch-target-signals";

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
        <Button
          variant="outline"
          size="sm"
          render={<Link to="/dashboard">Back</Link>}
        />
        <div>
          <h1 className="text-2xl font-semibold">{target.name}</h1>
          <p className="text-muted-foreground text-sm">{target.description}</p>
        </div>
      </div>

      <div className="rounded-xl border">
        <div className="border-b px-4 py-3 text-sm font-medium">Signals</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left text-xs uppercase">
              <tr className="border-b">
                <th className="px-4 py-2">Platform</th>
                <th className="px-4 py-2">Community</th>
                <th className="px-4 py-2">Title / Excerpt</th>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2">Reason</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {signals.length === 0 ? (
                <tr>
                  <td
                    className="text-muted-foreground px-4 py-6 text-center text-sm"
                    colSpan={7}
                  >
                    No signals yet.
                  </td>
                </tr>
              ) : (
                signals.map((signal) => (
                  <tr key={signal.id} className="border-b last:border-0">
                    <td className="px-4 py-2 capitalize">{signal.platform}</td>
                    <td className="px-4 py-2">{signal.community}</td>
                    <td className="px-4 py-2">
                      {signal.title ?? signal.content_excerpt}
                    </td>
                    <td className="px-4 py-2">{signal.score}</td>
                    <td className="px-4 py-2">{signal.reason}</td>
                    <td className="px-4 py-2 capitalize">{signal.status}</td>
                    <td className="px-4 py-2">
                      <a
                        className="text-primary underline underline-offset-4"
                        href={signal.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
