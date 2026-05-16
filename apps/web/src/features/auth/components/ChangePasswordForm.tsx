"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestSchemas } from "@homelab/contracts/schemas/auth";
import { useChangePassword } from "../hooks/useChangePassword";
import { mapServerFieldErrors } from "../utils/fieldErrors";
import FormField from "@client/components/FormField";
import { Button } from "@client/components/ui/button";
import { AuthLayout } from "./AuthLayout";
import { KeyRoundIcon, Loader, ArrowRightIcon } from "lucide-react";

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
  } = useForm<requestSchemas.ChangePasswordInput>({
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

  const fieldClassName = "bg-background/40 backdrop-blur-md h-12 w-full border-white/5 dark:border-white/5 rounded-2xl focus-within:border-primary/30 focus-within:bg-background/60 transition-all duration-300";

  return (
    <AuthLayout>
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="opacity-0 animate-fade-in-up [animation-delay:0.1s] glass-card flex flex-col gap-8 w-full p-8 sm:p-10 rounded-[2.5rem] border border-white/5 dark:border-white/10"
      >
        <div className="flex flex-col gap-6 text-left">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
            <KeyRoundIcon className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
              Account Security
            </span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground tracking-tight leading-none">
              Set new password
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium opacity-80 leading-snug">
              Choose a strong, unique password to secure your Homelab account.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <FormField
              className={fieldClassName}
              placeholder="New Password"
              type="password"
              registration={register("newPassword")}
              error={errors.newPassword?.message}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-13 w-full rounded-2xl font-bold text-base shadow-xl shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300"
          >
            {mutation.isPending || isSubmitting ? (
              <Loader className="animate-spin ml-2 w-4 h-4" />
            ) : (
              <>
                Update Password
                <ArrowRightIcon className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>

          <p className="text-center text-sm font-medium text-muted-foreground">
            Remembered your password?{" "}
            <a href="/auth/login" className="text-primary font-bold hover:underline underline-offset-4">
              Sign in
            </a>
          </p>
        </div>

        {errorMsg && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl animate-in fade-in zoom-in-95 duration-300">
            <p className="text-xs sm:text-sm text-destructive text-center font-bold tracking-tight">
              {errorMsg}
            </p>
          </div>
        )}
      </form>
    </AuthLayout>
  );
};

export default ChangePasswordForm;
