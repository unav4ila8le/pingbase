import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { HugeiconsIcon } from "@hugeicons/react";
import { Fire03Icon } from "@hugeicons/core-free-icons";

import { TargetDialog } from "./target-dialog";
import type { Target } from "@/types/global.types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { deleteTarget } from "@/server/targets/delete-target";

import { cn } from "@/lib/utils";

type TargetCardProps = {
  target: Target;
  signalCounts?: { new: number; total: number };
  onUpdated: (target: Target) => void;
  onDeleted: (targetId: string) => void;
};

export function TargetCard({
  target,
  signalCounts,
  onUpdated,
  onDeleted,
}: TargetCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteTarget({ data: { id: target.id } });
      onDeleted(result.id);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{target.name}</CardTitle>
        <CardDescription className="line-clamp-2">{target.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-end">
        {signalCounts ?
          <div className="text-green-600 text-sm flex items-center gap-1">
            <HugeiconsIcon icon={Fire03Icon} className="size-5" />
            <span>{signalCounts.new} new signals</span>
          </div> : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Link
          to="/targets/$targetId"
          params={{ targetId: target.id }}
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "cursor-default")}
        >
          View
        </Link>
        <TargetDialog
          mode="edit"
          target={target}
          onSuccess={onUpdated}
          trigger={
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              Edit
            </DialogTrigger>
          }
        />
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="destructive" size="sm" />}
          >
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete target</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the target and all related signals.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteError ? (
              <p className="text-destructive text-sm">{deleteError}</p>
            ) : null}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                {isDeleting ? (
                  <>
                    <Spinner /> Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
