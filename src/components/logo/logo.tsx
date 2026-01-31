import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/">
      <span
        className={cn("text-center text-xl font-semibold uppercase", className)}
      >
        Pingbase
      </span>
    </Link>
  );
}
