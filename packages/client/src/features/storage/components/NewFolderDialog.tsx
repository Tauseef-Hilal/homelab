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
import {
  CreateFolderInput,
  createFolderSchema,
} from "@shared/schemas/storage/request/folder.schema";
import { useForm } from "react-hook-form";
import { useCreateFolder } from "../hooks/useCreateFolder";
import useDriveStore from "../stores/driveStore";
import { toast } from "sonner";

interface NewFolderDialogProps {
  parentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const NewFolderDialog: React.FC<NewFolderDialogProps> = ({
  parentId,
  open,
  setOpen,
}) => {
  const { addFolder } = useDriveStore();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<CreateFolderInput>({
    defaultValues: { parentId },
    resolver: zodResolver(createFolderSchema),
  });

  const { mutate, isPending } = useCreateFolder({
    onSuccess: (data) => {
      addFolder(data.folder);
      setOpen(false);
    },
    onError: () => toast("Failed to create folder!"),
  });

  const onSubmit = (data: CreateFolderInput) => {
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
