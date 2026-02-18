import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";

import type { Target } from "@/types/global.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createTarget } from "@/server/targets/create-target";
import { updateTarget } from "@/server/targets/update-target";

type TargetDialogMode = "create" | "edit";

type TargetDialogValues = {
  name: string;
  description: string;
  keywords: string;
  exclusions: string;
  subreddits: string;
};

type TargetDialogProps = {
  mode: TargetDialogMode;
  trigger: React.ReactNode;
  target?: Target;
  onSuccess?: (target: Target) => void;
};

const listToString = (values?: Array<string>) =>
  values && values.length > 0 ? values.join(", ") : "";

const normalizeList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getInitialValues = (target?: Target): TargetDialogValues => ({
  name: target?.name ?? "",
  description: target?.description ?? "",
  keywords: listToString(target?.keywords),
  exclusions: listToString(target?.exclusions),
  subreddits: listToString(target?.subreddits),
});

const targetSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
  keywords: z.string(),
  exclusions: z.string(),
  subreddits: z.string(),
});

export function TargetDialog({
  mode,
  trigger,
  target,
  onSuccess,
}: TargetDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    defaultValues: getInitialValues(target),
    validators: {
      onSubmit: targetSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          name: value.name.trim(),
          description: value.description.trim(),
          keywords: normalizeList(value.keywords ?? ""),
          exclusions: normalizeList(value.exclusions ?? ""),
          subreddits: normalizeList(value.subreddits ?? ""),
        };

        if (mode === "edit" && !target) {
          throw new Error("Target not found.");
        }

        const result =
          mode === "create"
            ? await createTarget({ data: payload })
            : await updateTarget({
                data: {
                  id: target?.id ?? "",
                  ...payload,
                },
              });

        onSuccess?.(result);
        if (mode === "create") {
          toast.success("Target created");
        }
        setOpen(false);
      } catch (err: unknown) {
        toast.error(
          mode === "create"
            ? "Failed to create target"
            : "Failed to update target",
          {
            description:
              err instanceof Error ? err.message : "Something went wrong.",
          },
        );
      }
    },
  });

  const title = useMemo(
    () => (mode === "create" ? "New target" : "Edit target"),
    [mode],
  );
  const description = useMemo(
    () =>
      mode === "create"
        ? "Define what you want Pingbase to monitor."
        : "Update this target's details.",
    [mode],
  );

  useEffect(() => {
    if (open) {
      form.reset(getInitialValues(target));
    }
  }, [form, open, target]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      required
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={isInvalid}
                      placeholder="Foliofox"
                    />
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            />
            <form.Field
              name="description"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      required
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={isInvalid}
                      placeholder="AI-powered portfolio intelligence for personal finance enthusiasts."
                    />
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            />
            <form.Field
              name="keywords"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Keywords (optional)
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={isInvalid}
                      placeholder="foliofox, net worth, portfolio tracker"
                    />
                    <FieldDescription>
                      Comma-separated keywords to refine discovery.
                    </FieldDescription>
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            />
            <form.Field
              name="exclusions"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Exclusions (optional)
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={isInvalid}
                      placeholder="jobs, giveaway, spam"
                    />
                    <FieldDescription>
                      Comma-separated terms that should be ignored.
                    </FieldDescription>
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            />
            <form.Field
              name="subreddits"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Subreddits (optional)
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={isInvalid}
                      placeholder="personalfinance, fire, bogleheads, dividends"
                    />
                    <FieldDescription>
                      Comma-separated. When set, discovery runs only in these
                      subreddits instead of global search.
                    </FieldDescription>
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            />
          </FieldGroup>
          <DialogFooter showCloseButton>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner /> Saving...
                    </>
                  ) : mode === "create" ? (
                    "Create target"
                  ) : (
                    "Save changes"
                  )}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
