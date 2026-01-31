import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/logo/logo";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  return (
    <div className="flex flex-col gap-4 min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted">
      <Logo />
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
