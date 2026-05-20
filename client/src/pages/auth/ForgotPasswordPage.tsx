/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "sonner";
import { useState } from "react";
import { ROUTES } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/hooks/redux";
import { forgotPasswordSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "@/components/ui/input-text";
import { forgotPassword } from "@/store/slices/authSlice";
import { getErrorMessage, mapBackendErrorToField } from "@/lib/utils";
import { Mail } from "lucide-react";
import { AUTH_FORM_MESSAGES } from "@/components/auth/constants";
import { AuthLayoutContainer } from "@/components/auth/layouts/AuthLayoutContainer";
import { CenteredAuthLayout } from "@/components/auth/layouts/CenteredAuthLayout";
import { AuthLogoHeader } from "@/components/auth/sections/AuthLogoHeader";
import { AuthFormCard } from "@/components/auth/sections/AuthFormCard";
import { AuthFormHeader } from "@/components/auth/sections/AuthFormHeader";
import { AuthSubmitButton } from "@/components/auth/buttons/AuthSubmitButton";
import { AuthFooterLink } from "@/components/auth/buttons/AuthFooterLink";
import { SuccessStateModal } from "@/components/auth/sections/SuccessStateModal";

type ForgotPasswordFormData = {
  email: string;
};

export default function ForgotPasswordPage() {
  const dispatch = useAppDispatch();

  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      (await dispatch(forgotPassword({ email: data.email }))) as any;

      toast.success("Password reset link sent to your email");
      setSubmittedEmail(data.email);
      setSubmitted(true);

    } catch (error: unknown) {
      const message = getErrorMessage(error);

      const hasFieldErrors = mapBackendErrorToField(error, form.setError);

      if (!hasFieldErrors) {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayoutContainer>
        <SuccessStateModal
          variant="forgot-password"
          title={AUTH_FORM_MESSAGES.FORGOT_PASSWORD.SUCCESS_TITLE}
          emailDisplay={submittedEmail}
          steps={AUTH_FORM_MESSAGES.FORGOT_PASSWORD.STEPS}
          primaryAction={{
            text: "Back to Sign In",
            href: ROUTES.LOGIN,
          }}
          onTryAgain={() => setSubmitted(false)}
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
            icon={<Mail className="w-6 h-6" />}
            iconColor="blue"
            title={AUTH_FORM_MESSAGES.FORGOT_PASSWORD.TITLE}
            subtitle={AUTH_FORM_MESSAGES.FORGOT_PASSWORD.SUBTITLE}
          />

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputText
              hookForm={form}
              field="email"
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              icon={<Mail className="w-5 h-5" />}
              iconPosition="left"
              labelClassName="block text-sm font-medium text-gray-900"
              className="h-12 rounded-xl border-gray-200 bg-gray-50"
              disabled={isLoading}
            />

            <AuthSubmitButton
              isLoading={isLoading}
              normalText="Send Reset Link"
              loadingText="Sending"
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
