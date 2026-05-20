/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "sonner";
import { useState } from "react";
import { ROUTES } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { signUpSchema } from "@/lib/schemas";
import { useNavigate } from "react-router-dom";
import {
  signUp,
  setPendingVerificationEmail,
} from "@/store/slices/authSlice";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch } from "@/hooks/redux";
import {
  checkRateLimit,
  getRateLimitResetTime,
} from "@/lib/rateLimiter";
import { User, Mail } from "lucide-react";
import {
  getErrorMessage,
  mapBackendErrorToField,
  getErrorCode,
} from "@/lib/utils";
import { InputText } from "@/components/ui/input-text";
import { TwoColumnAuthLayout } from "@/components/auth/layouts/TwoColumnAuthLayout";
import { CenteredAuthLayout } from "@/components/auth/layouts/CenteredAuthLayout";
import { AuthFormCard } from "@/components/auth/sections/AuthFormCard";
import { PasswordInputField } from "@/components/ui/password-input-field";
import { ConfirmPasswordField } from "@/components/ui/confirm-password-field";
import { AuthSubmitButton } from "@/components/auth/buttons/AuthSubmitButton";

type SignUpFormData = {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignUpPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    if (!checkRateLimit("signup", 3, 60000)) {
      const resetTime = getRateLimitResetTime("signup", 60000);
      toast.error(
        `Too many signup attempts. Please try again in ${resetTime} second${
          resetTime !== 1 ? "s" : ""
        }.`,
      );
      return;
    }

    setIsLoading(true);

    try {
      await dispatch(
        signUp({
          full_name: data.full_name,
          email: data.email,
          password: data.password,
        }) as any,
      );

      dispatch(setPendingVerificationEmail(data.email));
      toast.success("Account created. Please verify your email.");
      navigate(ROUTES.VERIFY_EMAIL);
    } catch (error: unknown) {
      const errorCode = getErrorCode(error);
      const message = getErrorMessage(error);

      if (
        errorCode === "EMAIL_EXISTS" ||
        (errorCode === "CONFLICT" &&
          message.includes("already registered"))
      ) {
        form.setError("email", {
          type: "server",
          message:
            "This email is already registered. Please sign in instead.",
        });
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

  return (
    <TwoColumnAuthLayout>
      <CenteredAuthLayout>
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-bold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-gray-600">
            Join thousands of aspiring pilots in our community
          </p>
        </div>

        <AuthFormCard>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputText
              hookForm={form}
              field="full_name"
              label="Full Name"
              placeholder="Your real name"
              icon={<User className="w-5 h-5" />}
              iconPosition="left"
              labelClassName="block text-sm font-medium text-gray-900"
              className="h-12 rounded-xl border-gray-200 bg-gray-50"
              disabled={isLoading}
            />

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

            <PasswordInputField
              hookForm={form}
              field="password"
              label="Password"
              placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
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
              normalText="Create Account"
              loadingText="Creating account"
            />
          </form>
        </AuthFormCard>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href={ROUTES.LOGIN}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </a>
        </p>

        <div className="text-center">
          <a
            href={ROUTES.HOME}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to website
          </a>
        </div>
      </CenteredAuthLayout>
    </TwoColumnAuthLayout>
  );
}