"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mapServerFieldErrors } from "../utils/fieldErrors";
import {
  LoginInput,
  loginSchema,
  SignupInput,
  signupSchema,
} from "@shared/schemas/auth/request/auth.schema";
import FormField from "@client/components/FormField";
import { useState } from "react";
import { Button } from "@client/components/ui/button";
import { useLogin } from "../hooks/useLogin";
import { useSignup } from "../hooks/useSignup";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isLogin, setIsLogin] = useState(mode === "login");
  const schema = isLogin ? loginSchema : signupSchema;

  type FormValues = LoginInput | SignupInput;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const loginMutation = useLogin({
    onFieldError: (fieldErrors: any) => {
      mapServerFieldErrors(fieldErrors, setError);
    },
    onGlobalError: (msg: string) => setErrorMsg(msg),
  });

  const signupMutation = useSignup({
    onFieldError: (fieldErrors: any) => {
      mapServerFieldErrors(fieldErrors, setError);
    },
    onGlobalError: (msg: string) => setErrorMsg(msg),
  });

  const mutation = isLogin ? loginMutation : signupMutation;
  const onSubmit = (data: FormValues) => mutation.mutate(data as any);

  const fieldClassName = "bg-neutral-100 h-12 w-full shadow-none border-0";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col items-center gap-8 w-full px-8"
    >
      <h1 className="text-2xl w-full text-left font-bold">
        {isLogin ? "Please Log In" : "Create an Account"}
      </h1>

      {!isLogin && (
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
        error={errors.password?.message}
      />

      {isLogin && (
        <div className="flex flex-col w-full">
          <p className="text-sm w-full text-left">
            Don't have an account?{" "}
            <Button
              type="button"
              variant={"link"}
              className="font-medium cursor-pointer"
              onClick={() => setIsLogin(false)}
            >
              Register
            </Button>
          </p>
          <p className="text-sm w-full text-left">
            Forgot password?{" "}
            <Button
              type="button"
              variant={"link"}
              className="font-medium cursor-pointer"
            >
              Reset
            </Button>
          </p>
        </div>
      )}

      {!isLogin && (
        <p className="text-sm w-full text-left">
          Already have an account?{" "}
          <Button
            type="button"
            variant={"link"}
            className="font-medium cursor-pointer"
            onClick={() => setIsLogin(true)}
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
        {mutation.isPending
          ? isLogin
            ? "Logging in..."
            : "Signing up..."
          : isLogin
          ? "Login now"
          : "Sign up"}
      </Button>

      {mutation.isError && !errors.email && !errors.password && (
        <p className="text-red-500">{errorMsg}</p>
      )}
    </form>
  );
}
