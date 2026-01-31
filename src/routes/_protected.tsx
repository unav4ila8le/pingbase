import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchUser } from "@/server/auth/fetch-user";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async () => {
    const user = await fetchUser();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    return {
      user,
    };
  },
});
