import { useEffect, useMemo, useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
});

export function TargetDialog({
  mode,
  trigger,
  target,
  onSuccess,
}: TargetDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [values, setValues] = useState<TargetDialogValues>(() =>
    getInitialValues(target),
  );

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
      setValues(getInitialValues(target));
      setError(null);
    }
  }, [open, target]);

  const handleChange = (field: keyof TargetDialogValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim(),
        keywords: normalizeList(values.keywords),
        exclusions: normalizeList(values.exclusions),
      };

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
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="target-name">Name</Label>
            <Input
              id="target-name"
              required
              value={values.name}
              onChange={(event) => handleChange("name", event.target.value)}
              placeholder="Foliofox"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="target-description">Description</Label>
            <Textarea
              id="target-description"
              required
              value={values.description}
              onChange={(event) =>
                handleChange("description", event.target.value)
              }
              placeholder="AI-powered portfolio intelligence for personal finance enthusiasts."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="target-keywords">Keywords (optional)</Label>
            <Input
              id="target-keywords"
              value={values.keywords}
              onChange={(event) => handleChange("keywords", event.target.value)}
              placeholder="foliofox, net worth, portfolio tracker"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="target-exclusions">Exclusions (optional)</Label>
            <Input
              id="target-exclusions"
              value={values.exclusions}
              onChange={(event) =>
                handleChange("exclusions", event.target.value)
              }
              placeholder="jobs, giveaway, spam"
            />
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Spinner /> Saving...
                </>
              ) : mode === "create" ? (
                "Create target"
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
