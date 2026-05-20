/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { hasFieldError, getFieldErrorMessage } from "./input-utils";

type SelectOption = {
  value: string | number;
  label: string;
};

type InputSelectProps<T extends FieldValues> = {
  hookForm: UseFormReturn<T>;
  field: Path<T>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  labelMandatory?: boolean;
  infoText?: string;
  showInfoIcon?: boolean;
  containerClassName?: string;
  labelClassName?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

function InputSelect<T extends FieldValues>({
  hookForm,
  field,
  label,
  options,
  placeholder,
  labelMandatory,
  infoText,
  showInfoIcon,
  containerClassName,
  labelClassName,
  className,
  ...props
}: InputSelectProps<T>) {
    const {
      register,
      formState: { errors },
    } = hookForm;

    const hasError = hasFieldError(errors, field);
    const errorMessage = getFieldErrorMessage(errors, field);

    return (
      <div className={cn("space-y-2", containerClassName)}>
        <label
          htmlFor={String(field)}
          className={cn(
            "block text-sm font-medium text-gray-900",
            labelClassName
          )}
        >
          {label}
          {labelMandatory && <span className="text-red-500 ml-1">*</span>}
          {showInfoIcon && infoText && (
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <i className="icon icon-info" />
              <span>{infoText}</span>
            </div>
          )}
        </label>

        <select
          id={String(field)}
          className={cn(
            "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors",
            hasError
              ? "border-red-500 bg-red-50 focus-visible:ring-red-500"
              : "border-input focus-visible:ring-ring",
            className
          )}
          {...props}
          {...register(field, { valueAsNumber: false })}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasError && errorMessage && (
          <p className="text-sm text-red-600">{String(errorMessage)}</p>
        )}
      </div>
    );
}

export { InputSelect };
