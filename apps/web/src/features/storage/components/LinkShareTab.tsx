"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@client/components/ui/button";
import {
  LinkIcon,
  PlusIcon,
  Trash2Icon,
  CopyIcon,
  Edit2Icon,
  XIcon,
  CheckIcon,
  Move,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { PermissionCheckboxes } from "./PermissionCheckboxes";
import { permissionsToBitmask, bitmaskToPermissions } from "@client/lib/utils";
import { useGetSharedLinks } from "../hooks/useGetSharedLinks";
import { useCreateSharedLink } from "../hooks/useCreateSharedLink";
import { useUpdateSharedLink } from "../hooks/useUpdateSharedLink";
import { useRevokeSharedLink } from "../hooks/useRevokeSharedLink";

const schema = z.object({
  expiry: z
    .number()
    .min(1, "Minimum 1 day")
    .max(365, "Maximum 365 days")
    .nullable(),
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    copy: z.boolean(),
    delete: z.boolean(),
    share: z.boolean(),
  }),
});

type FormValues = z.infer<typeof schema>;

const LinkItem = ({
  link,
  onRevoke,
  onUpdate,
  isPending,
}: {
  link: any;
  onRevoke: (token: string) => void;
  onUpdate: (data: FormValues, token: string) => void;
  isPending: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Calculate remaining days for the input field
  const getInitialDays = () => {
    if (!link.expiresAt) return null;
    const diff = link.expiresAt - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1; // Default to 1 if already expired
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      expiry: getInitialDays(),
      permissions: bitmaskToPermissions(link.permissions),
    },
  });

  const handleSave = (data: FormValues) => {
    onUpdate(data, link.token);
    setIsEditing(false);
  };

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_CLIENT_URL}/drive?shareToken=${token}`,
    );
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg bg-card group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-primary/10 p-2 rounded-full shrink-0">
            <LinkIcon size={16} className="text-primary" />
          </div>
          <div className="truncate">
            <p className="text-sm font-medium truncate">
              {link.token.slice(0, 10)}...
            </p>
            <p className="text-xs text-muted-foreground">
              Expires:{" "}
              {link.expiresAt
                ? new Date(link.expiresAt).toLocaleDateString()
                : "Never"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => copyToClipboard(link.token)}
              >
                <CopyIcon size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditing(true)}
              >
                <Edit2Icon size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => onRevoke(link.token)}
                disabled={isPending}
              >
                <Trash2Icon size={14} />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
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
          <ExpiryInput
            control={form.control}
            error={form.formState.errors.expiry?.message}
          />
          <PermissionCheckboxes control={form.control} />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              className="h-7 px-2"
              disabled={isPending}
            >
              <CheckIcon size={14} className="mr-1" /> Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

const ExpiryInput = ({ control, error }: { control: any; error?: string }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-4">
      <Controller
        control={control}
        name="expiry"
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <input
              type="number"
              disabled={field.value === null}
              className="flex h-8 w-20 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:opacity-50"
              value={field.value ?? ""}
              onChange={(e) =>
                field.onChange(e.target.value ? parseInt(e.target.value) : 1)
              }
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={field.value === null}
                onChange={(e) => field.onChange(e.target.checked ? null : 7)}
                className="rounded border-gray-300"
              />
              Never expires
            </label>
          </div>
        )}
      />
    </div>
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export const LinkShareTab = ({ itemId }: { itemId: string }) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const { data, error, isError, isLoading } = useGetSharedLinks(itemId);

  const createMutation = useCreateSharedLink({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkShares", itemId] });
      toast.success("Link generated successfully");
      setIsAdding(false);
      addForm.reset();
    },
    onError: (err: string) => toast.error(err || "Failed to create link"),
  });

  const updateMutation = useUpdateSharedLink({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkShares", itemId] });
      toast.success("Link updated successfully");
    },
    onError: (err: string) => toast.error(err || "Failed to update link"),
  });

  const revokeMutation = useRevokeSharedLink({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkShares", itemId] });
      toast.success("Link revoked");
    },
    onError: (err: string) => toast.error(err || "Failed to revoke link"),
  });

  const addForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      expiry: 7,
      permissions: {
        read: true,
        write: false,
        copy: false,
        delete: false,
        share: false,
      },
    },
  });

  const handleAction = (values: FormValues, token?: string) => {
    const expiryTimestamp = values.expiry
      ? Date.now() + values.expiry * 24 * 60 * 60 * 1000
      : null;

    const payload = {
      expiry: expiryTimestamp,
      permissions: permissionsToBitmask(values.permissions),
    };

    if (token) {
      updateMutation.mutate({ token, ...payload });
    } else {
      createMutation.mutate({ itemId, ...payload });
    }
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
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {data?.links.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active links.
          </p>
        )}
        {data?.links.map((link: any) => (
          <LinkItem
            key={link.token}
            link={link}
            onRevoke={(token) => revokeMutation.mutate({ token })}
            onUpdate={handleAction}
            isPending={updateMutation.isPending || revokeMutation.isPending}
          />
        ))}
      </div>

      {isAdding ? (
        <form
          onSubmit={addForm.handleSubmit((val) => handleAction(val))}
          className="space-y-4 border p-4 rounded-lg bg-muted/10"
        >
          <ExpiryInput
            control={addForm.control}
            error={addForm.formState.errors.expiry?.message}
          />
          <PermissionCheckboxes control={addForm.control} />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              Generate Link
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setIsAdding(true)}
        >
          <PlusIcon size={16} className="mr-2" /> Create Link
        </Button>
      )}
    </div>
  );
};
