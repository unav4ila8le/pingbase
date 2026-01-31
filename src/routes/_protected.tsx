import { createFileRoute, redirect } from "@tanstack/react-router";
import { getClaims } from "@/server/auth/get-claims";
import { fetchUser } from "@/server/auth/fetch-user";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async () => {
    const claims = await getClaims();

    if (!claims) {
      throw redirect({ to: "/login" });
    }

    const user = await fetchUser();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    return {
      user,
      claims,
    };
  },
});
