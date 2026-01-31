import { Link, createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo/logo";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="flex flex-col items-center gap-6">
        <Logo />
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to="/login">Log in</Link>}
          />
          <Button
            nativeButton={false}
            render={<Link to="/signup">Sign up</Link>}
          />
        </div>
      </div>
    </div>
  );
}
