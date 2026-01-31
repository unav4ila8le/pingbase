import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/">
      <span className={cn("text-xl font-semibold text-center uppercase", className)}>
        Pingbase
      </span>
    </Link>
  );
}