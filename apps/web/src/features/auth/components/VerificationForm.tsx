"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useVerifyOtp } from "../hooks/useVerify";
import { mapServerFieldErrors } from "../utils/fieldErrors";
import { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@client/components/ui/input-otp";
import { Button } from "@client/components/ui/button";
import { Label } from "@client/components/ui/label";

interface VerificationFormProps {
  token: string;
}

const schema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits long"),
  token: z.string().min(1),
});

const VerificationForm: React.FC<VerificationFormProps> = ({ token }) => {
  const [errorMsg, setErrorMsg] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    setValue,
  } = useForm<{ otp: string; token: string }>({
    resolver: zodResolver(schema),
    defaultValues: { otp: "", token },
  });

  const mutation = useVerifyOtp({
    onFieldError: (fieldErrors: any) => {
      mapServerFieldErrors(fieldErrors, setError);
    },
    onGlobalError: (msg: string) => setErrorMsg(msg),
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    setErrorMsg("");
    mutation.mutate(data);
  };

  return (
    <form
      className="flex flex-col gap-6 w-full max-w-md mx-auto px-6 py-8"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <Label htmlFor="otp-input" className="text-lg font-semibold">
          Enter OTP
        </Label>

        <p className="text-sm text-muted-foreground">
          Please enter the 6-digit code sent to your email
        </p>

        <InputOTP
          id="otp-input"
          maxLength={6}
          {...register("otp")}
          onChange={(newValue) => {
            setValue("otp", newValue, { shouldValidate: true });
            setErrorMsg("");
          }}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>

          <InputOTPSeparator />

          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <p className="text-center text-sm text-destructive min-h-[20px]">
        {errors.otp?.message || errorMsg}
      </p>

      <Button disabled={mutation.isPending} type="submit" className="h-11">
        Verify
      </Button>
    </form>
  );
};

export default VerificationForm;
