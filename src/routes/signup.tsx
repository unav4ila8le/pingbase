import { createFileRoute } from "@tanstack/react-router";
import { SignUpForm } from "@/components/auth/signup-form";
import { Logo } from "@/components/logo/logo";

export const Route = createFileRoute("/signup")({
  component: SignUp,
});

function SignUp() {
  return (
    <div className="flex flex-col gap-4 min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted">
      <Logo />
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}
