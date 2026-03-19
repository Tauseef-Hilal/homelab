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

  const fieldClassName = "bg-muted h-12 w-full shadow-none border rounded-lg";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6 w-full max-w-md mx-auto px-6 py-8"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {formType == "login" && "Login to your account"}
          {formType == "signup" && "Create an account"}
          {formType == "verification" && "Request password reset"}
        </h1>

        <p className="text-sm text-muted-foreground">
          {formType == "login" && "Enter your credentials to continue"}
          {formType == "signup" && "Fill the form to create your account"}
          {formType == "verification" && "Enter your email to receive an OTP"}
        </p>
      </div>

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
        placeholder="Email"
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

      <div className="flex flex-col gap-1 text-sm">
        {formType != "verification" && (
          <p>
            Don't have an account?{" "}
            <Button
              type="button"
              variant="link"
              className="px-1"
              onClick={() => setFormType("signup")}
            >
              Register
            </Button>
          </p>
        )}

        {formType == "login" && (
          <p>
            Forgot password?{" "}
            <Button
              type="button"
              variant="link"
              className="px-1"
              onClick={() => setFormType("verification")}
            >
              Reset
            </Button>
          </p>
        )}

        {formType == "signup" && (
          <p>
            Already have an account?{" "}
            <Button
              type="button"
              variant="link"
              className="px-1"
              onClick={() => setFormType("login")}
            >
              Login
            </Button>
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="h-12 w-full"
      >
        {formType == "login" && "Login"}
        {formType == "signup" && "Signup"}
        {formType == "verification" && "Send OTP"}

        {(mutation.isPending || isSubmitting) && (
          <Loader className="animate-spin ml-2" />
        )}
      </Button>

      {errorMsg && (
        <p className="text-sm text-destructive text-center">{errorMsg}</p>
      )}
    </form>
  );
}
