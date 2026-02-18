import { createFileRoute, redirect } from "@tanstack/react-router";
import { SignUpForm } from "@/components/auth/signup-form";
import { Logo } from "@/components/logo/logo";
import { getClaims } from "@/backend/auth/get-claims";

export const Route = createFileRoute("/auth/signup")({
  beforeLoad: async () => {
    const claims = await getClaims();
    if (claims) {
      throw redirect({ to: "/" });
    }
  },
  component: SignUp,
});

function SignUp() {
  return (
    <div className="bg-muted flex min-h-svh w-full flex-col items-center justify-center gap-4 p-6 md:p-10">
      <Logo />
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}
