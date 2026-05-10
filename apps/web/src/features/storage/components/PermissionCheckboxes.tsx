"use client";

import { Checkbox } from "@client/components/ui/checkbox";
import { Label } from "@client/components/ui/label";
import { useId } from "react";
import { Control, Controller } from "react-hook-form";

interface Props {
  control: Control<any>;
}

export const PermissionCheckboxes: React.FC<Props> = ({ control }) => {
  const id = useId();

  return (
    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
      <Controller
        name="permissions.read"
        control={control}
        render={({ field }) => (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${id}-read`}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <Label htmlFor={`${id}-read`} className="cursor-pointer">
              Read
            </Label>
          </div>
        )}
      />
      <Controller
        name="permissions.write"
        control={control}
        render={({ field }) => (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${id}-write`}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <Label htmlFor={`${id}-write`} className="cursor-pointer">
              Write
            </Label>
          </div>
        )}
      />
      <Controller
        name="permissions.copy"
        control={control}
        render={({ field }) => (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${id}-copy`}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <Label htmlFor={`${id}-copy`} className="cursor-pointer">
              Copy
            </Label>
          </div>
        )}
      />
      <Controller
        name="permissions.delete"
        control={control}
        render={({ field }) => (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${id}-delete`}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <Label htmlFor={`${id}-delete`} className="cursor-pointer">
              Delete
            </Label>
          </div>
        )}
      />
      <Controller
        name="permissions.share"
        control={control}
        render={({ field }) => (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${id}-share`}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <Label htmlFor={`${id}-share`} className="cursor-pointer">
              Share
            </Label>
          </div>
        )}
      />
    </div>
  );
};
