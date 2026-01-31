import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { logOut } from "@/server/auth/log-out";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/_protected/dashboard")({
  component: Dashboard,
  loader: ({ context }) => {
    return {
      user: context.user,
    };
  },
});

function Dashboard() {
  const data = Route.useLoaderData();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
      await navigate({ to: "/" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div>
      <p>Hello {data.user.email}</p>
      <Button
        onClick={handleLogout}
        disabled={isLoggingOut}
        variant="destructive"
      >
        {isLoggingOut ? <><Spinner /> Logging out...</> : "Logout"}
      </Button>
    </div>
  );
}
