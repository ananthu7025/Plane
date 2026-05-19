import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthLogoHeader } from "./AuthLogoHeader";

interface SuccessStateModalProps {
  variant: "forgot-password" | "password-reset" | "email-verification";
  title: string;
  message?: string;
  emailDisplay?: string;
  steps?: string[];
  primaryAction: { text: string; href: string };
  onTryAgain?: () => void;
}

export function SuccessStateModal({
  variant,
  title,
  message,
  emailDisplay,
  steps,
  primaryAction,
  onTryAgain,
}: SuccessStateModalProps) {
  return (
    <div className="w-full max-w-md">
      <div className="flex items-center gap-3 justify-center mb-8">
        <AuthLogoHeader variant="mobile" />
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {emailDisplay && (
            <p className="text-gray-600">
              We've sent a{" "}
              {variant === "email-verification"
                ? "verification link"
                : "password reset link"}{" "}
              to{" "}
              <span className="font-semibold text-gray-900">{emailDisplay}</span>
            </p>
          )}
          {message && !emailDisplay && (
            <p className="text-gray-600">{message}</p>
          )}
        </div>

        {steps && steps.length > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-gray-700 space-y-2">
            <p className="font-medium">Follow these steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-left">
              {steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {variant === "password-reset" && (
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-gray-700">
            <p>Redirecting to sign in page in a moment...</p>
          </div>
        )}

        <Link
          to={primaryAction.href}
          className="block w-full h-12 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          {primaryAction.text}
        </Link>

        {variant === "forgot-password" && (
          <p className="text-sm text-gray-600">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={onTryAgain}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              try again
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
