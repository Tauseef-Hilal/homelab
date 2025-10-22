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
} from "@shared/schemas/storage/request.schema";
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
import { Progress } from "@client/components/ui/progress";
import { useBatchMutation } from "../hooks/useBatchMutation";
import { UploadFileResponse } from "@shared/schemas/storage/response.schema";

interface UploadDialogProps {
  folderId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  refetch: () => void;
}

const UploadDialog: React.FC<UploadDialogProps> = ({
  folderId,
  open,
  setOpen,
  refetch
}) => {
  const [ranOnce, setRanOnce] = useState(false);
  const { addFile } = useDriveStore();
  const [files, setFiles] = useState<File[]>([]);
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

  const { isPending, mutate, retry, failed, setFailed, progress } =
    useBatchMutation<UploadFileInput, UploadFileResponse>({
      mutationFn: mutation.mutateAsync,
      onSuccess: () => refetch(),
      delay: 1000,
    });

  const onSubmit = async (data: UploadFileInput) => {
    data.folderId = folderId;
    setRanOnce(true);

    if (failed.length > 0) {
      return retry();
    }

    if (files.length == 0) return;

    const inputs = files.map((file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderId", data.folderId ?? "");
      formData.append("visibility", data.visibility);
      return formData as any as UploadFileInput;
    });

    mutate(inputs);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        setRanOnce(false);
        setFiles([])
      }}
    >
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
              setFiles([...(e.target.files ?? [])]);
              setFailed([]);
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

          {ranOnce && (
            <div>
              {isPending ? (
                <Progress value={progress} />
              ) : (
                <p>
                  {failed.length > 0
                    ? `Failed to upload ${failed.length} files`
                    : "Files uploaded successfully"}
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || isPending || files.length == 0}
          >
            {failed.length > 0 ? "Retry" : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
