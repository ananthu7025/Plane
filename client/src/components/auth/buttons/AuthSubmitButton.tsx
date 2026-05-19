import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "../../ui/button";
import { type ReactNode } from "react";

interface AuthSubmitButtonProps {
  isLoading: boolean;
  normalText: string;
  loadingText: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export function AuthSubmitButton({
  isLoading,
  normalText,
  loadingText,
  icon,
  disabled = false,
  onClick,
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isLoading || disabled}
      className="w-full h-12 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 mt-6"
      onClick={onClick}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          {loadingText}...
        </>
      ) : (
        <>
          {normalText}
          {icon || <ArrowRight className="w-4 h-4 ml-2" />}
        </>
      )}
    </Button>
  );
}
