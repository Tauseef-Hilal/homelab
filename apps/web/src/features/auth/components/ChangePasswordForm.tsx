"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestSchemas, responseSchemas } from "@homelab/contracts/schemas/auth";
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
    resolver: zodResolver(requestSchemas.changePasswordSchema),
    defaultValues: { token },
  });

  const mutation = useChangePassword({
    onGlobalError: (err) => setErrorMsg(err),
    onFieldError: (errors) => mapServerFieldErrors(errors, setError),
  });

  const onSubmit = (data: requestSchemas.ChangePasswordInput) => {
    setErrorMsg("");
    mutation.mutate(data);
  };
  const fieldClassName = "bg-neutral-100 h-12 w-full shadow-none border-0";

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 w-full max-w-md mx-auto px-6 py-8"
    >
      <h1 className="text-2xl font-semibold">Set a new password</h1>

      <FormField
        className="bg-muted h-12 w-full border rounded-lg"
        placeholder="New Password"
        type="password"
        registration={register("newPassword")}
        error={errors.newPassword?.message}
      />

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="h-12 w-full"
      >
        Change Password
      </Button>

      {errorMsg && (
        <p className="text-sm text-destructive text-center">{errorMsg}</p>
      )}
    </form>
  );
};

export default ChangePasswordForm;
