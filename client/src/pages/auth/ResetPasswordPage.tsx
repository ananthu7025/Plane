/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/hooks/redux";
import { resetPasswordSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/store/slices/authSlice";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import {
  getErrorMessage,
  mapBackendErrorToField,
  getErrorCode,
} from "@/lib/utils";
import { AUTH_FORM_MESSAGES } from "@/components/auth/constants";
import { AuthLayoutContainer } from "@/components/auth/layouts/AuthLayoutContainer";
import { CenteredAuthLayout } from "@/components/auth/layouts/CenteredAuthLayout";
import { AuthLogoHeader } from "@/components/auth/sections/AuthLogoHeader";
import { AuthFormCard } from "@/components/auth/sections/AuthFormCard";
import { AuthFormHeader } from "@/components/auth/sections/AuthFormHeader";
import { PasswordInputField } from "@/components/ui/password-input-field";
import { ConfirmPasswordField } from "@/components/ui/confirm-password-field";
import { AuthSubmitButton } from "@/components/auth/buttons/AuthSubmitButton";
import { AuthFooterLink } from "@/components/auth/buttons/AuthFooterLink";
import { SuccessStateModal } from "@/components/auth/sections/SuccessStateModal";

type ResetPasswordFormData = {
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!token || !email) {
      navigate(ROUTES.FORGOT_PASSWORD);
    }
  }, [token, email, navigate]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);

    try {
      (await dispatch(
        resetPassword({
          email,
          token,
          newPassword: data.newPassword,
        }),
      )) as any;

      setIsSuccess(true);

      toast.success("Password reset successfully!");
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 2000);
    } catch (error: unknown) {
      const errorCode = getErrorCode(error);
      const message = getErrorMessage(error);

      if (errorCode === "RESET_TOKEN_EXPIRED") {
        toast.error(
          "The reset link has expired. Please request a new one.",
        );
        navigate(ROUTES.FORGOT_PASSWORD);
        return;
      }

      if (errorCode === "RESET_TOKEN_USED") {
        toast.error(
          "This reset link has already been used. Please request a new one.",
        );
        navigate(ROUTES.FORGOT_PASSWORD);
        return;
      }

      if (errorCode === "RESET_TOKEN_INVALID") {
        toast.error("Invalid reset link. Please request a new one.");
        navigate(ROUTES.FORGOT_PASSWORD);
        return;
      }

      if (errorCode === "NOT_FOUND") {
        toast.error("Email not found. Please sign up first.");
        navigate(ROUTES.SIGNUP);
        return;
      }

      const hasFieldErrors = mapBackendErrorToField(error, form.setError);

      if (!hasFieldErrors) {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayoutContainer>
        <SuccessStateModal
          variant="password-reset"
          title={AUTH_FORM_MESSAGES.RESET_PASSWORD.SUCCESS_TITLE}
          message={AUTH_FORM_MESSAGES.RESET_PASSWORD.SUCCESS_SUBTITLE}
          primaryAction={{
            text: "Go to Sign In",
            href: ROUTES.LOGIN,
          }}
        />
      </AuthLayoutContainer>
    );
  }

  return (
    <AuthLayoutContainer>
      <CenteredAuthLayout>
        <AuthLogoHeader variant="mobile" />

        <AuthFormCard>
          <AuthFormHeader
            icon={<Lock className="w-6 h-6" />}
            iconColor="blue"
            title={AUTH_FORM_MESSAGES.RESET_PASSWORD.TITLE}
            subtitle={AUTH_FORM_MESSAGES.RESET_PASSWORD.SUBTITLE}
          />

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PasswordInputField
              hookForm={form}
              field="newPassword"
              label="New Password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              showPassword={showPassword}
              onToggleShow={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            />

            <ConfirmPasswordField
              hookForm={form}
              field="confirmPassword"
              showPassword={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            />

            <AuthSubmitButton
              isLoading={isLoading}
              normalText="Reset Password"
              loadingText="Resetting"
            />
          </form>

          <AuthFooterLink
            text="Want to sign in?"
            linkText="Back to sign in"
            href={ROUTES.LOGIN}
          />
        </AuthFormCard>
      </CenteredAuthLayout>
    </AuthLayoutContainer>
  );
}