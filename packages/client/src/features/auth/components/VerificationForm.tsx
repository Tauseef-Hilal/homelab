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
    formState: { errors, isSubmitting },
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

  const onSubmit = (data: z.infer<typeof schema>) => mutation.mutate(data);

  return (
    <form
      className="flex flex-col gap-2 w-full px-10"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div className="flex flex-col items-center gap-4">
        <Label htmlFor="otp-input" className="text-md font-bold">
          Please enter the OTP sent to your email
        </Label>
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

      <p className="text-center text-sm text-red-500 h-8">
        {errors.otp && errors.otp.message}
        {errorMsg && !errors.otp && errorMsg}
      </p>

      <Button
        disabled={isSubmitting || mutation.isPending}
        type="submit"
        className="cursor-pointer"
      >
        Verify
      </Button>
    </form>
  );
};

export default VerificationForm;
