import FormField from "@client/components/FormField";
import { Button } from "@client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@client/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestSchemas } from "@homelab/shared/schemas/storage";
import { useForm } from "react-hook-form";
import { useCreateFolder } from "../hooks/useCreateFolder";
import { toast } from "sonner";

interface NewFolderDialogProps {
  parentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  refetch: () => void;
}

const NewFolderDialog: React.FC<NewFolderDialogProps> = ({
  parentId,
  open,
  setOpen,
  refetch,
}) => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<requestSchemas.CreateFolderInput>({
    defaultValues: { parentId },
    resolver: zodResolver(requestSchemas.createFolderSchema),
  });

  const { mutate, isPending } = useCreateFolder({
    onSuccess: (data) => {
      refetch();
      setOpen(false);
    },
    onError: () => toast("Failed to create folder!"),
  });

  const onSubmit = (data: requestSchemas.CreateFolderInput) => {
    data.parentId = parentId;
    mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
          <DialogDescription>
            Create a new folder in the current directory
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <FormField
              type="text"
              placeholder="Folder Name"
              registration={register("folderName")}
              error={errors.folderName?.message}
            />
            <Button type="submit" disabled={isSubmitting || isPending}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewFolderDialog;
