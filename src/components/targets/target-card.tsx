import { Link } from "@tanstack/react-router";
import { useState } from "react";

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
import { Button } from "@/components/ui/button";
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

type TargetCardProps = {
  target: Target;
  onUpdated: (target: Target) => void;
  onDeleted: (targetId: string) => void;
};

export function TargetCard({ target, onUpdated, onDeleted }: TargetCardProps) {
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
        <CardDescription>{target.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-muted-foreground text-xs">0 new / 0 total</div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          variant="default"
          size="sm"
          render={
            <Link to="/targets/$targetId" params={{ targetId: target.id }}>
              View
            </Link>
          }
        />
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
              <p className="text-sm text-destructive">{deleteError}</p>
            ) : null}
            <AlertDialogFooter>
              <AlertDialogCancel />
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
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
