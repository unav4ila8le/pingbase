import { Link, createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo/logo";
import { getClaims } from "@/server/auth/get-claims";

export const Route = createFileRoute("/")({
  loader: async () => {
    const claims = await getClaims();
    return {
      isAuthenticated: Boolean(claims),
    };
  },
  component: App,
});

function App() {
  const { isAuthenticated } = Route.useLoaderData();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="flex flex-col items-center gap-6">
        <Logo />
        <div className="flex gap-2">
          {isAuthenticated ? (
            <Button
              nativeButton={false}
              render={<Link to="/dashboard">Dashboard</Link>}
            />
          ) : (
            <>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link to="/login">Log in</Link>}
              />
              <Button
                nativeButton={false}
                render={<Link to="/signup">Sign up</Link>}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
