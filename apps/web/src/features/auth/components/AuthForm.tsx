"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mapServerFieldErrors } from "../utils/fieldErrors";
import { requestSchemas } from "@homelab/contracts/schemas/auth";
import FormField from "@client/components/FormField";
import { useState } from "react";
import { Button } from "@client/components/ui/button";
import { useLogin } from "../hooks/useLogin";
import { useSignup } from "../hooks/useSignup";
import { useRequestChangePassword } from "../hooks/useRequestChangePassword";
import { Loader } from "lucide-react";

type FormType = "login" | "signup" | "verification";

interface AuthFormProps {
  formType: FormType;
}

export function AuthForm({ formType: defaultFormType }: AuthFormProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formType, setFormType] = useState(defaultFormType);

  type FormValues =
    | requestSchemas.LoginInput
    | requestSchemas.SignupInput
    | requestSchemas.RequestChangePasswordInput;

  const schemas: Record<FormType, any> = {
    login: requestSchemas.loginSchema,
    signup: requestSchemas.signupSchema,
    verification: requestSchemas.requestChangePasswordSchema,
  };

  const loginMutation = useLogin({
    onFieldError: (fieldErrors) => mapServerFieldErrors(fieldErrors, setError),
    onGlobalError: setErrorMsg,
  });

  const signupMutation = useSignup({
    onFieldError: (fieldErrors) => mapServerFieldErrors(fieldErrors, setError),
    onGlobalError: setErrorMsg,
  });

  const verificationMutation = useRequestChangePassword({
    onGlobalError: setErrorMsg,
  });

  const mutations = {
    login: loginMutation,
    signup: signupMutation,
    verification: verificationMutation,
  };

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schemas[formType]),
  });

  const mutation = mutations[formType];

  const onSubmit = (data: FormValues) => {
    setErrorMsg(null);
    mutation.mutate(data as any);
  };

  const fieldClassName = "bg-muted/50 h-12 w-full shadow-none border-muted-foreground/10 rounded-xl focus-within:border-primary/30 transition-all";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="glass-card flex flex-col gap-10 w-full max-w-md mx-auto px-10 py-12 rounded-[2.5rem]"
      >
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-black tracking-tight">
            {formType == "login" && "Welcome Back"}
            {formType == "signup" && "Join Homelab"}
            {formType == "verification" && "Reset Password"}
          </h1>

          <p className="text-sm text-muted-foreground font-semibold tracking-tight opacity-70">
            {formType == "login" && "Access your digital sanctuary"}
            {formType == "signup" && "Create your digital home today"}
            {formType == "verification" && "Check your inbox for a code"}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {formType == "signup" && (
            <FormField
              className={fieldClassName}
              placeholder="Username"
              type="text"
              registration={register("username")}
              error={"username" in errors ? errors.username?.message : undefined}
            />
          )}

          <FormField
            className={fieldClassName}
            placeholder="Email Address"
            type="email"
            registration={register("email")}
            error={errors.email?.message}
          />

          {formType != "verification" && (
            <FormField
              className={fieldClassName}
              placeholder="Password"
              type="password"
              registration={register("password")}
              error={"password" in errors ? errors.password?.message : undefined}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-12 w-full rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
          >
            {formType == "login" && "Continue"}
            {formType == "signup" && "Create Account"}
            {formType == "verification" && "Send Reset Link"}

            {(mutation.isPending || isSubmitting) && (
              <Loader className="animate-spin ml-2 w-4 h-4" />
            )}
          </Button>

          <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
            {formType != "verification" && (
              <p>
                {formType === "login" ? "New here?" : "Already a member?"}{" "}
                <button
                  type="button"
                  className="text-primary font-semibold hover:underline underline-offset-4"
                  onClick={() => setFormType(formType === "login" ? "signup" : "login")}
                >
                  {formType === "login" ? "Register" : "Sign in"}
                </button>
              </p>
            )}

            {formType == "login" && (
              <button
                type="button"
                className="text-xs hover:text-foreground transition-colors"
                onClick={() => setFormType("verification")}
              >
                Forgot password?
              </button>
            )}

            {formType == "verification" && (
              <button
                type="button"
                className="text-primary font-semibold hover:underline underline-offset-4"
                onClick={() => setFormType("login")}
              >
                Back to login
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
            <p className="text-xs text-destructive text-center font-medium">{errorMsg}</p>
          </div>
        )}
      </form>
    </div>
  );
}
