"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mapServerFieldErrors } from "../utils/fieldErrors";
import {
  LoginInput,
  loginSchema,
  RequestChangePasswordInput,
  requestChangePasswordSchema,
  SignupInput,
  signupSchema,
} from "@shared/schemas/auth/request/auth.schema";
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

  type FormValues = LoginInput | SignupInput | RequestChangePasswordInput;

  const schemas: Record<FormType, any> = {
    login: loginSchema,
    signup: signupSchema,
    verification: requestChangePasswordSchema,
  };

  const mutations = {
    login: useLogin({
      onFieldError: (fieldErrors: any) => {
        mapServerFieldErrors(fieldErrors, setError);
      },
      onGlobalError: (msg: string) => setErrorMsg(msg),
    }),
    signup: useSignup({
      onFieldError: (fieldErrors: any) => {
        mapServerFieldErrors(fieldErrors, setError);
      },
      onGlobalError: (msg: string) => setErrorMsg(msg),
    }),
    verification: useRequestChangePassword({
      onGlobalError: (msg) => setErrorMsg(msg),
    }),
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
  const onSubmit = (data: FormValues) => mutation.mutate(data as any);

  const fieldClassName = "bg-neutral-100 h-12 w-full shadow-none border-0";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col items-center gap-8 w-full px-8"
    >
      <h1 className="text-2xl w-full text-left font-bold">
        {formType == "login" && "Login to your account"}
        {formType == "signup" && "Create an Account"}
        {formType == "verification" && "Enter email to get an OTP"}
      </h1>

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

      <FormField
        className={fieldClassName}
        placeholder="Password"
        type="password"
        registration={register("password")}
        error={"password" in errors ? errors.password?.message : undefined}
      />

      {formType != "signup" && (
        <div className="flex flex-col w-full">
          <p className="text-sm w-full text-left">
            Don't have an account?{" "}
            <Button
              type="button"
              variant={"link"}
              className="font-medium cursor-pointer"
              onClick={() => setFormType("signup")}
            >
              Register
            </Button>
          </p>
          {formType == "login" && (
            <p className="text-sm w-full text-left">
              Forgot password?{" "}
              <Button
                type="button"
                variant={"link"}
                className="font-medium cursor-pointer"
                onClick={() => setFormType("verification")}
              >
                Reset
              </Button>
            </p>
          )}
        </div>
      )}

      {formType == "signup" && (
        <p className="text-sm w-full text-left">
          Already have an account?{" "}
          <Button
            type="button"
            variant={"link"}
            className="font-medium cursor-pointer"
            onClick={() => setFormType("login")}
          >
            Login
          </Button>
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || mutation.isPending}
        className="h-12 w-full cursor-pointer"
      >
        {formType == "login" && "Login"}
        {formType == "signup" && "Signup"}
        {formType == "verification" && "Send OTP"}
        {mutation.isPending ||
          (isSubmitting && <Loader className="animate-spin" />)}
      </Button>

      {mutation.isError && !errors.email && (
        <p className="text-red-500">{errorMsg}</p>
      )}
    </form>
  );
}
