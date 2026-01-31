import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type ConfirmSearch = {
  token_hash?: string;
  type?: EmailOtpType;
  next?: string;
};

const confirmFn = createServerFn({ method: "GET" })
  .inputValidator((searchParams: unknown): ConfirmSearch => {
    if (!searchParams || typeof searchParams !== "object") {
      return {};
    }

    const params = searchParams as Record<string, unknown>;
    return {
      token_hash:
        typeof params.token_hash === "string" ? params.token_hash : undefined,
      type: typeof params.type === "string" ? (params.type as EmailOtpType) : undefined,
      next: typeof params.next === "string" ? params.next : undefined,
    };
  })
  .handler(async (ctx) => {
    const searchParams = ctx.data;
    const token_hash = searchParams.token_hash;
    const type = searchParams.type ?? null;
    const next =
      typeof searchParams.next === "string" && searchParams.next.startsWith("/")
        ? searchParams.next
        : "/";

    if (token_hash && type) {
      const supabase = createClient();

      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      if (!error) {
        // redirect user to specified redirect URL or root of app
        throw redirect({ href: next });
      } else {
        // redirect the user to an error page with some instructions
        throw redirect({
          to: `/auth/error`,
          search: { error: error.message },
        });
      }
    }

    // redirect the user to an error page with some instructions
    throw redirect({
      to: `/auth/error`,
      search: { error: "No token hash or type" },
    });
  });

export const Route = createFileRoute("/auth/confirm")({
  preload: false,
  loader: (opts) => confirmFn({ data: opts.location.search }),
});
