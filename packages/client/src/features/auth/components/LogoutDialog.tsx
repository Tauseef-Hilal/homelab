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
import {
  LogoutInput,
  logoutSchema,
} from "@shared/schemas/auth/request/auth.schema";
import { Controller, useForm } from "react-hook-form";
import { useLogout } from "../hooks/useLogout";
import { useState } from "react";
import { Button } from "@client/components/ui/button";
import { Checkbox } from "@client/components/ui/checkbox";
import { Label } from "@client/components/ui/label";

interface LogoutDialogProps {}

export const LogoutDialog: React.FC<LogoutDialogProps> = ({}) => {
  const [errorMsg, setErrorMsg] = useState("");
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LogoutInput>({ resolver: zodResolver(logoutSchema) });

  const mutation = useLogout({
    onError: (msg) => setErrorMsg(msg),
  });

  const onSubmit = handleSubmit((data) => mutation.mutate(data));

  return (
    <Dialog>
      <DialogTrigger>Logout</DialogTrigger>
      <DialogContent>
        <form noValidate onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
            <DialogDescription>Are you sure to logout?</DialogDescription>
          </DialogHeader>
          <div className="py-2">
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
                  <Label htmlFor="logoutAll">Log out of all devices</Label>
                </div>
              )}
            />

            {errorMsg && <p className="text-red-500">{errorMsg}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant={"outline"}>Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="cursor-pointer"
            >
              Logout
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
