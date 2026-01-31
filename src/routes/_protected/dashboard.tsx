import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logOut } from "@/server/auth/log-out";

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
        className="hover:bg-primary/80"
      >
        {isLoggingOut ? "Logging out..." : "Logout"}
      </Button>
    </div>
  );
}
