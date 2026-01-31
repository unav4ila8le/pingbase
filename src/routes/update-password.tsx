import { createFileRoute } from "@tanstack/react-router";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { Logo } from "@/components/logo/logo";

export const Route = createFileRoute("/update-password")({
  component: UpdatePassword,
});

function UpdatePassword() {
  return (
    <div className="flex flex-col gap-4 min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted">
      <Logo />
      <div className="w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
