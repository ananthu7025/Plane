import { Loader2 } from "lucide-react";

interface ResendButtonProps {
  onResend: () => void;
  isLoading: boolean;
  timer: number;
  text?: string;
  disabledText?: string;
}

export function ResendButton({
  onResend,
  isLoading,
  timer,
  text = "Resend OTP",
  disabledText = "Resend in",
}: ResendButtonProps) {
  return (
    <button
      onClick={onResend}
      disabled={timer > 0 || isLoading}
      className="w-full h-10 border border-blue-500 text-blue-600 rounded-xl font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Sending...
        </span>
      ) : timer > 0 ? (
        `${disabledText} ${timer}s`
      ) : (
        text
      )}
    </button>
  );
}
