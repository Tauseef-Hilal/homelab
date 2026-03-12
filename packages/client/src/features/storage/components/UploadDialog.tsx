"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@client/components/ui/dialog";

import { Button } from "@client/components/ui/button";
import { Input } from "@client/components/ui/input";
import { Progress } from "@client/components/ui/progress";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@client/components/ui/select";

import { Upload, X } from "lucide-react";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { requestSchemas } from "@homelab/shared/schemas/storage";
import { useUploadFile } from "../hooks/useUploadFile";
import { useBatchMutation } from "../hooks/useBatchMutation";

import { UploadFileResponse } from "@homelab/shared/schemas/storage/response.schema";
import { useQueryClient } from "@tanstack/react-query";

interface UploadDialogProps {
  folderId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  folderPath: string;
}

const UploadDialog: React.FC<UploadDialogProps> = ({
  folderId,
  open,
  setOpen,
  folderPath,
}) => {
  const queryClient = useQueryClient();

  const [files, setFiles] = useState<File[]>([]);
  const [ranOnce, setRanOnce] = useState(false);

  const form = useForm<requestSchemas.UploadFileInput>({
    resolver: zodResolver(requestSchemas.uploadFileSchema),
    defaultValues: {
      folderId,
      visibility: "public",
    },
  });

  const uploadMutation = useUploadFile({
    onError: () => {},
    onSuccess: () => {},
  });

  const { mutate, retry, progress, failed, setFailed, isPending } =
    useBatchMutation<requestSchemas.UploadFileInput, UploadFileResponse>({
      mutationFn: uploadMutation.mutateAsync,
      delay: 1000,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        queryClient.invalidateQueries({
          queryKey: ["listDirectory", folderPath],
        });
      },
    });

  const reset = () => {
    setFiles([]);
    setRanOnce(false);
    setFailed([]);
    form.reset();
  };

  const onSubmit = async (data: requestSchemas.UploadFileInput) => {
    if (files.length === 0) return;

    setRanOnce(true);

    if (failed.length > 0) return retry();

    const inputs = files.map((file) => {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("folderId", folderId);
      formData.append("visibility", data.visibility);

      return formData as any as requestSchemas.UploadFileInput;
    });

    mutate(inputs);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Drag files here or select them to upload.
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted transition">
            <Upload size={28} className="mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click or drag files here
            </p>

            <Input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                setFiles([...(e.target.files ?? [])]);
                setFailed([]);
              }}
            />
          </label>

          {files.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-auto">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border rounded px-3 py-1 text-sm"
                >
                  {file.name}

                  <button type="button" onClick={() => removeFile(i)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Select
            value={form.watch("visibility")}
            onValueChange={(v) =>
              form.setValue(
                "visibility",
                v as requestSchemas.UploadFileInput["visibility"],
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="shared">Shared</SelectItem>
            </SelectContent>
          </Select>

          {ranOnce && (
            <div className="space-y-2">
              {isPending ? (
                <>
                  <Progress value={progress} />
                  <p className="text-xs text-muted-foreground">
                    {Math.round(progress)}%
                  </p>
                </>
              ) : (
                <p className="text-sm">
                  {failed.length > 0
                    ? `Failed to upload ${failed.length} files`
                    : "Upload complete"}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={files.length === 0 || isPending}
              className="w-full"
            >
              {failed.length > 0 ? "Retry Upload" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
