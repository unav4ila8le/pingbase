import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { getClaims } from "@/server/auth/get-claims";
import { fetchUser } from "@/server/auth/fetch-user";

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
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <main className="mx-auto min-h-svh w-full max-w-5xl p-4">
      <Outlet />
    </main>
  );
}
