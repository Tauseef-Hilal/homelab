"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@client/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestSchemas } from "@homelab/contracts/schemas/auth";
import { Controller, useForm } from "react-hook-form";
import { useLogout } from "../hooks/useLogout";
import { useState } from "react";
import { Button } from "@client/components/ui/button";
import { Checkbox } from "@client/components/ui/checkbox";
import { Label } from "@client/components/ui/label";
import { LucideLogOut } from "lucide-react";

interface LogoutDialogProps {}

export const LogoutDialog: React.FC<LogoutDialogProps> = () => {
  const [errorMsg, setErrorMsg] = useState("");

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<requestSchemas.LogoutInput>({
    resolver: zodResolver(requestSchemas.logoutSchema),
    defaultValues: {
      logoutAll: false,
    },
  });

  const mutation = useLogout({
    onError: (msg) => setErrorMsg(msg),
  });

  const onSubmit = handleSubmit((data) => mutation.mutate(data));

  return (
    <Dialog>
      {/* Trigger */}
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <LucideLogOut size={18} />
        </Button>
      </DialogTrigger>

      {/* Dialog */}
      <DialogContent className="sm:max-w-md">
        <form noValidate onSubmit={onSubmit}>
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2">
              <LucideLogOut size={18} />
              Logout
            </DialogTitle>

            <DialogDescription>
              Are you sure you want to log out?
            </DialogDescription>
          </DialogHeader>

          {/* Options */}
          <div className="py-4 space-y-3">
            <Controller
              name="logoutAll"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="logoutAll"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />

                  <Label htmlFor="logoutAll" className="text-sm cursor-pointer">
                    Log out of all devices
                  </Label>
                </div>
              )}
            />

            {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
          </div>

          {/* Footer */}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button
              type="submit"
              variant="destructive"
              disabled={mutation.isPending || isSubmitting}
            >
              Logout
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
