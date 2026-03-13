"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@client/components/ui/dialog";

import { Input } from "@client/components/ui/input";
import { Button } from "@client/components/ui/button";

import { File, Folder } from "../types/storage.types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useMoveItems } from "../hooks/useMoveItems";
import { isFolder } from "@client/lib/utils";

import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import z from "zod";
import { useEffect } from "react";
import { useMoveMutation } from "../hooks/useMoveMutation";

interface RenameProps {
  item: File | Folder;
  open: boolean;
  setOpen: (open: boolean) => void;
  parentPath: string;
}

const schema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(255, "Name too long")
    .refine(
      (name) => !/[./\\]/.test(name),
      "Name cannot contain dots or slashes",
    ),
});

type RenameInput = z.infer<typeof schema>;

const RenameDialog: React.FC<RenameProps> = ({
  item,
  open,
  setOpen,
  parentPath,
}) => {
  const ext = item.name.includes(".") ? item.name.split(".").pop() : undefined;
  const baseName = ext ? item.name.slice(0, -(ext.length + 1)) : item.name;

  const form = useForm<RenameInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: baseName,
    },
  });

  useEffect(() => {
    form.reset({ name: baseName });
  }, [item, open]);

  const mutation = useMoveMutation(parentPath);

  const onSubmit = (data: RenameInput) => {
    mutation.mutate({
      destinationFolderId: isFolder(item) ? item.parentId : undefined,
      items: [
        {
          id: item.id,
          newName: data.name,
          type: isFolder(item) ? "folder" : "file",
        },
      ],
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>

        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Input autoFocus {...form.register("name")} className="flex-1" />

            {ext && (
              <span className="text-sm text-muted-foreground">.{ext}</span>
            )}
          </div>

          {form.formState.errors.name && (
            <p className="text-sm text-red-500">
              {form.formState.errors.name.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={mutation.isPending}>
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameDialog;
