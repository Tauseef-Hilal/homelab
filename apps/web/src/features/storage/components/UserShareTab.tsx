"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@client/components/ui/button";
import { Input } from "@client/components/ui/input";
import {
  UserIcon,
  PlusIcon,
  Trash2Icon,
  Edit2Icon,
  XIcon,
  CheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { PermissionCheckboxes } from "./PermissionCheckboxes";
import { permissionsToBitmask, bitmaskToPermissions } from "@client/lib/utils";
import { useGetUserShares } from "../hooks/useGetUserShares";
import { useShareWithUser } from "../hooks/useShareWithUser";
import { useRevokeUserShare } from "../hooks/useRevokeUserShare";
import { useUpdateUserShare } from "../hooks/useUpdateUserShare";

const schema = z.object({
  userEmail: z.email("Invalid email address"),
  permissions: z
    .object({
      read: z.boolean(),
      write: z.boolean(),
      copy: z.boolean(),
      delete: z.boolean(),
      share: z.boolean(),
    })
    .refine((data) => data.read || data.write || data.delete || data.share, {
      message: "At least one permission must be selected",
      path: ["read"],
    }),
});

type FormValues = z.infer<typeof schema>;

const ShareItem = ({
  share,
  onRevoke,
  onUpdate,
  isPending,
}: {
  share: any;
  onRevoke: (email: string) => void;
  onUpdate: (data: FormValues) => void;
  isPending: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      userEmail: share.user.email,
      permissions: bitmaskToPermissions(share.permissions),
    },
  });

  const handleSave = (data: FormValues) => {
    onUpdate(data);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <UserIcon size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{share.user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setIsEditing(true)}
              >
                <Edit2Icon size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => onRevoke(share.user.email)}
                disabled={isPending}
              >
                <Trash2Icon size={14} />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => {
                setIsEditing(false);
                form.reset();
              }}
            >
              <XIcon size={14} />
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <form
          onSubmit={form.handleSubmit(handleSave)}
          className="mt-2 pt-2 border-t space-y-3"
        >
          <PermissionCheckboxes control={form.control} />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              className="h-7 px-2"
              disabled={isPending}
            >
              <CheckIcon size={14} className="mr-1" /> Save Permissions
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export const UserShareTab = ({ itemId }: { itemId: string }) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const { data, error, isError, isLoading } = useGetUserShares(itemId);

  // For creating new shares
  const shareMutation = useShareWithUser({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userShares", itemId] });
      toast.success("User share created successfully");
      setIsAdding(false);
      addForm.reset();
    },
    onError: (err: string) => toast.error(err || "Failed to share"),
  });

  // For updating existing shares
  const updateMutation = useUpdateUserShare({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userShares", itemId] });
      toast.success("Permissions updated");
    },
    onError: (err: string) =>
      toast.error(err || "Failed to update permissions"),
  });

  // For revoking access
  const revokeMutation = useRevokeUserShare({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userShares", itemId] });
      toast.success("Access revoked");
    },
    onError: (err: string) => toast.error(err || "Failed to revoke"),
  });

  const addForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      userEmail: "",
      permissions: {
        read: true,
        write: false,
        copy: false,
        delete: false,
        share: false,
      },
    },
  });

  const onAdd = (values: FormValues) => {
    shareMutation.mutate({
      itemId,
      userEmail: values.userEmail,
      permissions: permissionsToBitmask(values.permissions),
    });
  };

  const onUpdate = (values: FormValues) => {
    updateMutation.mutate({
      itemId,
      userEmail: values.userEmail,
      permissions: permissionsToBitmask(values.permissions),
    });
  };

  if (isLoading)
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );

  if (isError)
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        {error.response?.data.message ?? "Unknown error occured"}
      </div>
    );

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* List of current shares */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {data?.shares.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Not shared with anyone yet.
          </p>
        )}
        {data?.shares.map((share: any) => (
          <ShareItem
            key={share.id}
            share={share}
            onRevoke={(email) =>
              revokeMutation.mutate({ itemId, userEmail: email })
            }
            onUpdate={onUpdate}
            isPending={updateMutation.isPending || revokeMutation.isPending}
          />
        ))}
      </div>

      {/* Add New Share Form */}
      {isAdding ? (
        <form
          onSubmit={addForm.handleSubmit(onAdd)}
          className="space-y-4 border p-4 rounded-lg bg-muted/10"
        >
          <div className="space-y-1">
            <Input
              placeholder="user@example.com"
              {...addForm.register("userEmail")}
              autoFocus
            />
            {addForm.formState.errors.userEmail && (
              <p className="text-xs text-red-500">
                {addForm.formState.errors.userEmail.message}
              </p>
            )}
          </div>

          <PermissionCheckboxes control={addForm.control} />
          {addForm.formState.errors.permissions?.read && (
            <p className="text-xs text-red-500">
              {addForm.formState.errors.permissions.read.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={shareMutation.isPending}>
              Share
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setIsAdding(true)}
        >
          <PlusIcon size={16} className="mr-2" /> Add People
        </Button>
      )}
    </div>
  );
};
