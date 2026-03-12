import FormField from "@client/components/FormField";
import { Button } from "@client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@client/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestSchemas } from "@homelab/shared/schemas/storage";
import { useForm } from "react-hook-form";
import { useCreateFolder } from "../hooks/useCreateFolder";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface NewFolderDialogProps {
  parentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  parentPath: string;
}

const NewFolderDialog: React.FC<NewFolderDialogProps> = ({
  parentId,
  open,
  setOpen,
  parentPath,
}) => {
  const queryClient = useQueryClient();

  const form = useForm<requestSchemas.CreateFolderInput>({
    defaultValues: { parentId, folderName: "" },
    resolver: zodResolver(requestSchemas.createFolderSchema),
  });

  const { mutate, isPending } = useCreateFolder({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["listDirectory", parentPath],
      });
      form.reset();
      setOpen(false);
    },
    onError: () => toast.error("Failed to create folder"),
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open]);

  const onSubmit = (data: requestSchemas.CreateFolderInput) =>
    mutate({ ...data, parentId });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
          <DialogDescription>
            Create a new folder in this directory.
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            type="text"
            placeholder="Folder name"
            registration={form.register("folderName")}
            error={form.formState.errors.folderName?.message}
          />

          <DialogFooter>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || isPending}
              className="w-full"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewFolderDialog;
