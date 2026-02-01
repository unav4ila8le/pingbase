import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      const supabase = createClient();

      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: value.email,
          password: value.password,
        });
        if (signInError) throw signInError;
        await navigate({ to: "/dashboard" });
      } catch (err: unknown) {
        setSubmitError(
          err instanceof Error ? err.message : "An error occurred",
        );
      }
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Login</CardTitle>
          <CardDescription>Enter your credentials below</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <div className="flex flex-col gap-6">
              <FieldGroup>
                <form.Field
                  name="email"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          placeholder="mail@example.com"
                          required
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                        />
                        {isInvalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    );
                  }}
                />
                <form.Field
                  name="password"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field data-invalid={isInvalid}>
                        <div className="flex items-center">
                          <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                          <Link
                            to="/forgot-password"
                            className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          required
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                        />
                        {isInvalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    );
                  }}
                />
              </FieldGroup>
              {submitError ? (
                <p className="text-destructive text-sm">{submitError}</p>
              ) : null}
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    type="submit"
                    className="hover:bg-primary/80 w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner /> Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
