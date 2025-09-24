"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@client/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UploadFileInput,
  uploadFileSchema,
} from "@shared/schemas/storage/request/file.schema";
import { useForm } from "react-hook-form";
import { useUploadFile } from "../hooks/useUploadFile";
import { Input } from "@client/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@client/components/ui/select";
import { useState } from "react";
import { Button } from "@client/components/ui/button";
import useDriveStore from "../stores/driveStore";
import { AxiosError } from "axios";
import { Progress } from "@client/components/ui/progress";
import { sleep } from "@client/lib/utils";

interface UploadDialogProps {
  folderId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const UploadDialog: React.FC<UploadDialogProps> = ({
  folderId,
  open,
  setOpen,
}) => {
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);

  const { addFile } = useDriveStore();
  const [visibility, setVisibility] =
    useState<UploadFileInput["visibility"]>("public");
  const {
    handleSubmit,
    register,
    formState: { isSubmitting },
  } = useForm<UploadFileInput>({
    defaultValues: { folderId, visibility },
    resolver: zodResolver(uploadFileSchema),
  });

  const mutation = useUploadFile({
    onSuccess: () => {},
    onError: () => {},
  });

  const onSubmit = async (data: UploadFileInput) => {
    if (files.length == 0) return;

    setPending(true);
    setProgress(0);

    const failedFiles: File[] = [];
    let completed = 0;

    await Promise.allSettled(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folderId", data.folderId ?? "");
        formData.append("visibility", data.visibility);

        try {
          const result = await mutation.mutateAsync(
            formData as any as UploadFileInput
          );
          addFile(result.file);
          setProgress(((++completed + 1) / files.length) * 100);
          await sleep(1000);
        } catch (error) {
          if (error instanceof AxiosError) {
            failedFiles.push(file);
          }
        }
      })
    );

    setFiles(failedFiles);
    setFailed(failedFiles.length > 0);
    setPending(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>Select files to upload</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-2"
        >
          <Input
            required
            multiple
            type="file"
            onChange={(e) => {
              setFailed(false);
              setFiles([...(e.target.files ?? [])]);
            }}
          />
          <Select
            value={visibility}
            defaultValue="public"
            onValueChange={(value) =>
              setVisibility(value as UploadFileInput["visibility"])
            }
            {...register("visibility")}
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

          {pending ? (
            <Progress value={progress} />
          ) : (
            <div>
              {progress > 0 && (
                <p>
                  {failed
                    ? `Failed to upload ${files.length} files`
                    : "Files uploaded successfully"}
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || mutation.isPending || files.length == 0}
          >
            {failed ? "Retry" : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
