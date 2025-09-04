"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChangePasswordInput,
  changePasswordSchema,
} from "@shared/schemas/auth/request/auth.schema";
import { useChangePassword } from "../hooks/useChangePassword";
import { mapServerFieldErrors } from "../utils/fieldErrors";
import FormField from "@client/components/FormField";
import { Button } from "@client/components/ui/button";

interface ChangePasswordFormProps {
  token: string;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ token }) => {
  const [errorMsg, setErrorMsg] = useState("");
  const {
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { token },
  });

  const mutation = useChangePassword({
    onGlobalError: (err) => setErrorMsg(err),
    onFieldError: (errors) => mapServerFieldErrors(errors, setError),
  });

  const onSubmit = (data: ChangePasswordInput) => mutation.mutate(data);
  const fieldClassName = "bg-neutral-100 h-12 w-full shadow-none border-0";

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-center gap-8 w-full px-8"
    >
      <h1 className="text-2xl w-full text-left font-bold">
        Set a new password for your account
      </h1>

      <FormField
        className={fieldClassName}
        placeholder="New Password"
        type="password"
        registration={register("newPassword")}
        error={errors.newPassword?.message}
      />

      <Button
        type="submit"
        disabled={isSubmitting || mutation.isPending}
        className="h-12 w-full cursor-pointer"
      >
        Change Password
      </Button>

      {mutation.isError && !errors.newPassword && (
        <p className="text-red-500">{errorMsg}</p>
      )}
    </form>
  );
};

export default ChangePasswordForm;
