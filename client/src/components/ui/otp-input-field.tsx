import { InputText } from "./input-text";
import { type UseFormReturn } from "react-hook-form";

interface OtpInputFieldProps {
  hookForm: UseFormReturn<any>;
  field?: string;
  label?: string;
  disabled?: boolean;
  maxLength?: number;
  labelClassName?: string;
  className?: string;
}

export function OtpInputField({
  hookForm,
  field = "otp",
  label = "Enter OTP Code",
  disabled = false,
  maxLength = 6,
  labelClassName = "block text-sm font-medium text-gray-900",
  className = "h-14 rounded-xl border-gray-200 bg-gray-50 text-center text-2xl font-mono tracking-widest",
}: OtpInputFieldProps) {
  return (
    <InputText
      hookForm={hookForm}
      field={field}
      label={label}
      type="text"
      placeholder="000000"
      labelClassName={labelClassName}
      className={className}
      disabled={disabled}
      inputMode="numeric"
      maxLength={maxLength}
    />
  );
}
