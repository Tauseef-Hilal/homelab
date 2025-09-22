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
  const { addFile } = useDriveStore();
  const [file, setFile] = useState<File | undefined>();
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
    onSuccess: (data) => {
      addFile(data.file);
      setOpen(false)
    },
    onError: () => {},
  });

  const onSubmit = (data: UploadFileInput) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderId", data.folderId ?? "");
    formData.append("visibility", data.visibility);

    mutation.mutate(formData as any as UploadFileInput);
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
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0])} />
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
          <Button
            type="submit"
            disabled={isSubmitting || mutation.isPending || !file}
          >
            Upload
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
