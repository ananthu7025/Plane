import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { ResendButton } from "../buttons/ResendButton";

interface ResendOtpSectionProps {
  onResend: () => void;
  isResending: boolean;
  timer: number;
}

export function ResendOtpSection({
  onResend,
  isResending,
  timer,
}: ResendOtpSectionProps) {
  return (
    <>
      <div className="pt-4 border-t border-gray-200">
        <p className="text-center text-sm text-gray-600 mb-3">
          Didn't receive the code?
        </p>
        <ResendButton
          onResend={onResend}
          isLoading={isResending}
          timer={timer}
        />
      </div>

      <div className="text-center pt-2">
        <p className="text-sm text-gray-600">
          Wrong email?{" "}
          <Link
            to={ROUTES.SIGNUP}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go back
          </Link>
        </p>
      </div>
    </>
  );
}
