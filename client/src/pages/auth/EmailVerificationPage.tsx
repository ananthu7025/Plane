/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailVerificationSchema } from "@/lib/schemas";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { OtpInputField } from "@/components/ui/otp-input-field";
import { verifyEmail, resendOtp } from "@/store/slices/authSlice";
import { AuthFormCard } from "@/components/auth/sections/AuthFormCard";
import { AuthFormHeader } from "@/components/auth/sections/AuthFormHeader";
import { AuthLogoHeader } from "@/components/auth/sections/AuthLogoHeader";
import { AuthSubmitButton } from "@/components/auth/buttons/AuthSubmitButton";
import { ResendOtpSection } from "@/components/auth/sections/ResendOtpSection";
import { CenteredAuthLayout } from "@/components/auth/layouts/CenteredAuthLayout";
import { AuthLayoutContainer } from "@/components/auth/layouts/AuthLayoutContainer";
import {
  getErrorMessage,
  mapBackendErrorToField,
  getErrorCode,
} from "@/lib/utils";

type EmailVerificationFormData = {
  otp: string;
};

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const email =
    useAppSelector((state) => state.auth.pendingVerificationEmail) || "";

  const [resendTimer, setResendTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<EmailVerificationFormData>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    if (!email) {
      navigate(ROUTES.SIGNUP);
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(
        () => setResendTimer(resendTimer - 1),
        1000,
      );
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resendTimer]);

  const onSubmit = async (data: EmailVerificationFormData) => {
    setIsVerifying(true);

    try {
      await dispatch(
        verifyEmail({
          email,
          otp: data.otp,
        }) as any,
      );

      toast.success("Email verified successfully");
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 1500);
    } catch (error: unknown) {
      const errorCode = getErrorCode(error);
      const message = getErrorMessage(error);

      switch (errorCode) {
        case "OTP_EXPIRED":
          toast.error("The OTP has expired. Please request a new one.");
          setResendTimer(0);
          return;

        case "OTP_INVALID":
          form.setError("otp", {
            type: "server",
            message: "Incorrect code. Please try again.",
          });
          return;

        case "EMAIL_ALREADY_VERIFIED":
          toast.success(
            "Your email is already verified. Redirecting to login...",
          );
          setTimeout(() => {
            navigate(ROUTES.LOGIN);
          }, 1500);
          return;

        case "NOT_FOUND":
          toast.error("Unable to process request.");
          navigate(ROUTES.SIGNUP);
          return;

        default: {
          const hasFieldErrors = mapBackendErrorToField(error, form.setError);
          if (!hasFieldErrors) {
            toast.error(message);
          }
        }
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);

    try {
      await dispatch(resendOtp({ email }) as any);

      toast.success("OTP resent to your email");

      setResendTimer(60);
      form.reset();
    } catch (error: unknown) {
      const errorCode = getErrorCode(error);
      const message = getErrorMessage(error);

      if (errorCode === "CONFLICT" && message.includes("already verified")) {
        toast.success(
          "Your email is already verified. Redirecting to login...",
        );
        setTimeout(() => navigate(ROUTES.LOGIN), 1500);
        return;
      }

      if (errorCode === "NOT_FOUND") {
        toast.error("Email not found. Please sign up first.");
        navigate(ROUTES.SIGNUP);
        return;
      }

      if (errorCode === "RATE_LIMIT_EXCEEDED") {
        toast.error("Too many requests. Please wait before trying again.");
        return;
      }

      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayoutContainer>
      <CenteredAuthLayout>
        <AuthLogoHeader variant="mobile" />

        <AuthFormCard>
          <AuthFormHeader
            icon={<Mail className="w-6 h-6" />}
            iconColor="blue"
            title="Verify Your Email"
            subtitle={`We've sent a 6-digit code to ${email}`}
          />

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <OtpInputField hookForm={form} field="otp" disabled={isVerifying} />

            <AuthSubmitButton
              isLoading={isVerifying}
              normalText="Verify Email"
              loadingText="Verifying"
            />
          </form>

          <ResendOtpSection
            onResend={handleResendOtp}
            isResending={isResending}
            timer={resendTimer}
          />
        </AuthFormCard>
      </CenteredAuthLayout>
    </AuthLayoutContainer>
  );
}
