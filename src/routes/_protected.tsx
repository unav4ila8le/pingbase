import {
  Outlet,
  createFileRoute,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { getClaims } from "@/backend/auth/get-claims";
import { fetchUser } from "@/backend/auth/fetch-user";
import { fetchActiveIngestionRuns } from "@/backend/ingestion/fetch-active-ingestion-runs";
import { isIngestionRunActive } from "@/lib/ingestion-runs";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async () => {
    const claims = await getClaims();

    if (!claims) {
      throw redirect({ to: "/auth/login" });
    }

    const user = await fetchUser();

    if (!user) {
      throw redirect({ to: "/auth/login" });
    }

    return {
      user,
      claims,
    };
  },
  loader: async () => ({
    activeIngestionRuns: await fetchActiveIngestionRuns(),
  }),
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { activeIngestionRuns } = Route.useLoaderData();
  const router = useRouter();
  const hasActiveIngestionRun = activeIngestionRuns.some((run) =>
    isIngestionRunActive(run.status),
  );

  useEffect(() => {
    if (!hasActiveIngestionRun) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void router.invalidate();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [hasActiveIngestionRun, router]);

  return (
    <main className="mx-auto min-h-svh w-full max-w-5xl p-4">
      <Outlet />
    </main>
  );
}
