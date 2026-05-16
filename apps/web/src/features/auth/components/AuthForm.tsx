"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { mapServerFieldErrors } from "../utils/fieldErrors";
import { requestSchemas } from "@homelab/contracts/schemas/auth";
import FormField from "@client/components/FormField";
import { useState } from "react";
import { Button } from "@client/components/ui/button";
import { useLogin } from "../hooks/useLogin";
import { useSignup } from "../hooks/useSignup";
import { useRequestChangePassword } from "../hooks/useRequestChangePassword";
import { Loader, SparklesIcon, ArrowRightIcon } from "lucide-react";
import { AuthLayout } from "./AuthLayout";

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

  const schemas: Record<FormType, z.ZodType<any, any, any>> = {
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

  const mutations: Record<FormType, { mutate: (data: any) => void; isPending: boolean }> = {
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
    mutation.mutate(data);
  };

  const fieldClassName = "bg-background/40 backdrop-blur-md h-12 w-full border-white/5 dark:border-white/5 rounded-2xl focus-within:border-primary/30 focus-within:bg-background/60 transition-all duration-300";

  const errorData = errors as Record<string, any>;

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="opacity-0 animate-fade-in-up [animation-delay:0.1s] glass-card flex flex-col gap-8 w-full p-8 sm:p-10 rounded-[2.5rem] border border-white/5 dark:border-white/10"
      >
        <div className="flex flex-col gap-6 text-left">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
            <SparklesIcon className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
              {formType === "login" ? "Welcome Back" : formType === "signup" ? "Get Started" : "Security"}
            </span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground tracking-tight leading-none">
              {formType === "login" && "Login to Homelab"}
              {formType === "signup" && "Create your account"}
              {formType === "verification" && "Reset your password"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium opacity-80 leading-snug">
              {formType === "login" && "Enter your credentials to access your workspace."}
              {formType === "signup" && "Join the secure ecosystem for files and chat."}
              {formType === "verification" && "We'll send you a secure link to recover access."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {formType === "signup" && (
            <div className="space-y-1.5">
              <FormField
                className={fieldClassName}
                placeholder="Username"
                type="text"
                registration={register("username" as never)}
                error={errorData.username?.message}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <FormField
              className={fieldClassName}
              placeholder="Email Address"
              type="email"
              registration={register("email" as never)}
              error={errorData.email?.message}
            />
          </div>

          {formType !== "verification" && (
            <div className="space-y-1.5">
              <FormField
                className={fieldClassName}
                placeholder="Password"
                type="password"
                registration={register("password" as never)}
                error={errorData.password?.message}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-13 w-full rounded-2xl font-bold text-base shadow-xl shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300"
          >
            {formType === "login" && "Sign In"}
            {formType === "signup" && "Create Account"}
            {formType === "verification" && "Send Link"}

            {mutation.isPending || isSubmitting ? (
              <Loader className="animate-spin ml-2 w-4 h-4" />
            ) : (
              <ArrowRightIcon className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>

          <div className="flex flex-col items-center gap-3 text-sm">
            {formType !== "verification" && (
              <p className="text-muted-foreground font-medium">
                {formType === "login" ? "New to Homelab?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="text-primary font-bold hover:underline underline-offset-4"
                  onClick={() => {
                    setFormType(formType === "login" ? "signup" : "login");
                    setErrorMsg(null);
                  }}
                >
                  {formType === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            )}

            {formType === "login" && (
              <button
                type="button"
                className="text-xs font-medium text-muted-foreground/60 hover:text-primary transition-colors"
                onClick={() => setFormType("verification")}
              >
                Forgot your password?
              </button>
            )}

            {formType === "verification" && (
              <button
                type="button"
                className="text-primary font-bold hover:underline underline-offset-4"
                onClick={() => setFormType("login")}
              >
                Back to login
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl animate-in fade-in zoom-in-95 duration-300">
            <p className="text-xs sm:text-sm text-destructive text-center font-bold tracking-tight">{errorMsg}</p>
          </div>
        )}
      </form>
    </AuthLayout>
  );
}
