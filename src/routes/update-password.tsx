import { createFileRoute } from "@tanstack/react-router";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { Logo } from "@/components/logo/logo";

export const Route = createFileRoute("/update-password")({
  component: UpdatePassword,
});

function UpdatePassword() {
  return (
    <div className="bg-muted flex min-h-svh w-full flex-col items-center justify-center gap-4 p-6 md:p-10">
      <Logo />
      <div className="w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
