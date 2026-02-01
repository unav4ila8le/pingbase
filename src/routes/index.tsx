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
      <div className="flex flex-col items-center">
        <Logo />
        <p className="mt-2 max-w-sm text-center">
          The engine that listens to online conversations and surfaces
          high-intent signals for your brand.
        </p>
        <div className="mt-6 flex gap-2">
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
                render={<Link to="/auth/login">Log in</Link>}
              />
              <Button
                nativeButton={false}
                render={<Link to="/auth/signup">Sign up</Link>}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
