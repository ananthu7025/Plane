/* eslint-disable @typescript-eslint/no-explicit-any */
import { Eye, EyeOff } from "lucide-react";
import { InputText } from "./input-text";
import { type UseFormReturn } from "react-hook-form";

interface PasswordInputFieldProps {
  hookForm: UseFormReturn<any>;
  field: string;
  label?: string;
  showPassword: boolean;
  onToggleShow: () => void;
  disabled?: boolean;
  placeholder?: string;
  labelClassName?: string;
  className?: string;
}

export function PasswordInputField({
  hookForm,
  field,
  label = "Password",
  showPassword,
  onToggleShow,
  disabled = false,
  placeholder = "••••••••",
  labelClassName = "block text-sm font-medium text-gray-900",
  className = "h-12 rounded-xl border-gray-200 bg-gray-50",
}: PasswordInputFieldProps) {
  return (
    <InputText
      hookForm={hookForm}
      field={field}
      label={label}
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      icon={
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggleShow}
          className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none pointer-events-auto"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      }
      iconPosition="right"
      labelClassName={labelClassName}
      className={className}
      disabled={disabled}
    />
  );
}
