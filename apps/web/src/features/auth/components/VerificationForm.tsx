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
import { AuthLayout } from "./AuthLayout";
import { ShieldCheckIcon, Loader, ArrowRightIcon } from "lucide-react";

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
    onFieldError: (fieldErrors: Record<string, string[]>) => {
      mapServerFieldErrors(fieldErrors, setError);
    },
    onGlobalError: (msg: string) => setErrorMsg(msg),
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    setErrorMsg("");
    mutation.mutate(data);
  };

  return (
    <AuthLayout>
      <form
        className="opacity-0 animate-fade-in-up [animation-delay:0.1s] glass-card flex flex-col gap-8 w-full p-8 sm:p-10 rounded-[2.5rem] border border-white/5 dark:border-white/10"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="flex flex-col gap-6 text-left">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
              Two-Factor Auth
            </span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground tracking-tight leading-none">
              Verify your identity
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium opacity-80 leading-snug">
              We&apos;ve sent a 6-digit verification code to your registered email address.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 py-2">
          <Label htmlFor="otp-input" className="sr-only">
            Enter OTP
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
            <InputOTPGroup className="gap-2 sm:gap-3">
              <InputOTPSlot index={0} className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-white/10 bg-background/40 backdrop-blur-md text-lg font-bold" />
              <InputOTPSlot index={1} className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-white/10 bg-background/40 backdrop-blur-md text-lg font-bold" />
              <InputOTPSlot index={2} className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-white/10 bg-background/40 backdrop-blur-md text-lg font-bold" />
            </InputOTPGroup>

            <InputOTPSeparator className="text-muted-foreground/30 mx-1" />

            <InputOTPGroup className="gap-2 sm:gap-3">
              <InputOTPSlot index={3} className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-white/10 bg-background/40 backdrop-blur-md text-lg font-bold" />
              <InputOTPSlot index={4} className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-white/10 bg-background/40 backdrop-blur-md text-lg font-bold" />
              <InputOTPSlot index={5} className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-white/10 bg-background/40 backdrop-blur-md text-lg font-bold" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="flex flex-col gap-6">
          <Button 
            disabled={mutation.isPending} 
            type="submit" 
            className="h-13 w-full rounded-2xl font-bold text-base shadow-xl shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300"
          >
            {mutation.isPending ? (
              <Loader className="animate-spin mr-2 w-4 h-4" />
            ) : (
              <>
                Verify Account
                <ArrowRightIcon className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>

          <p className="text-center text-sm font-medium text-muted-foreground">
            Didn&apos;t receive a code?{" "}
            <button type="button" className="text-primary font-bold hover:underline underline-offset-4">
              Resend
            </button>
          </p>
        </div>

        {(errors.otp?.message || errorMsg) && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl animate-in fade-in zoom-in-95 duration-300">
            <p className="text-xs sm:text-sm text-destructive text-center font-bold tracking-tight">
              {errors.otp?.message || errorMsg}
            </p>
          </div>
        )}
      </form>
    </AuthLayout>
  );
};

export default VerificationForm;
