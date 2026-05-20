/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ROUTES } from "@/lib/constants";
import { signInSchema } from "@/lib/schemas";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks/redux";
import { signIn } from "@/store/slices/authSlice";
import { Checkbox } from "@/components/ui/checkbox";
import { InputText } from "@/components/ui/input-text";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkRateLimit, getRateLimitResetTime } from "@/lib/rateLimiter";
import {
  getErrorMessage,
  mapBackendErrorToField,
  getErrorCode,
} from "@/lib/utils";
import { Mail } from "lucide-react";
import { TwoColumnAuthLayout } from "@/components/auth/layouts/TwoColumnAuthLayout";
import { CenteredAuthLayout } from "@/components/auth/layouts/CenteredAuthLayout";
import { AuthFormCard } from "@/components/auth/sections/AuthFormCard";
import { PasswordInputField } from "@/components/ui/password-input-field";
import { AuthSubmitButton } from "@/components/auth/buttons/AuthSubmitButton";

type SignInFormData = {
  email: string;
  password: string;
};

interface LoginPageProps {
  portalType?: "student" | "admin";
}

export default function LoginPage({
  portalType = "student",
}: LoginPageProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    if (!checkRateLimit("signin", 5, 60000)) {
      const resetTime = getRateLimitResetTime("signin", 60000);
      toast.error(
        `Too many login attempts. Please try again in ${resetTime} second${
          resetTime !== 1 ? "s" : ""
        }.`,
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await dispatch(signIn(data) as any);
      navigate(result.user.role === "ADMIN" ? ROUTES.ADMIN_DASHBOARD : ROUTES.STUDENT_DASHBOARD);
    } catch (error: unknown) {
      const errorCode = getErrorCode(error);
      const message = getErrorMessage(error);

      if (errorCode === "UNAUTHORIZED") {
        if (message.includes("verify your email")) {
          navigate(ROUTES.VERIFY_EMAIL);
          return;
        }

        if (message.includes("suspended")) {
          toast.error(
            "Your account has been suspended. Please contact support.",
          );
          return;
        }

        if (message.includes("inactive")) {
          toast.error(
            "Your account is inactive. Please contact support to reactivate.",
          );
          return;
        }

        toast.error("Incorrect email or password");
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
            Welcome Back, Aviator
          </h2>
          <p className="mt-2 text-gray-600">
            {portalType === "admin"
              ? "Sign in to your Admin Portal"
              : "Sign in to your Student Portal"}
          </p>
        </div>
        <AuthFormCard>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputText
              hookForm={form}
              field="email"
              label="Email"
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
              showPassword={showPassword}
              onToggleShow={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            />

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked === true)
                  }
                  disabled={isLoading}
                  id="remember-me"
                />
                <label
                  htmlFor="remember-me"
                  className="text-gray-600 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <a
                href={ROUTES.FORGOT_PASSWORD}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </a>
            </div>

            <AuthSubmitButton
              isLoading={isLoading}
              normalText="Sign In"
              loadingText="Signing in"
            />
          </form>
        </AuthFormCard>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a
            href={ROUTES.SIGNUP}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create account
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