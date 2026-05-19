/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { hasFieldError, getFieldErrorMessage } from "./input-utils";

type InputTextareaProps<T extends FieldValues> = {
  hookForm: UseFormReturn<T>;
  field: Path<T>;
  label: string;
  labelMandatory?: boolean;
  infoText?: string;
  showInfoIcon?: boolean;
  containerClassName?: string;
  labelClassName?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const InputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  InputTextareaProps<any>
>(
  (
    {
      hookForm,
      field,
      label,
      labelMandatory,
      infoText,
      showInfoIcon,
      containerClassName,
      labelClassName,
      className,
      ...props
    },
    ref
  ) => {
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

        <textarea
          id={String(field)}
          className={cn(
            "flex min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors resize-none",
            hasError
              ? "border-red-500 bg-red-50 focus-visible:ring-red-500"
              : "border-input focus-visible:ring-ring",
            className
          )}
          {...register(field)}
          {...props}
          ref={ref}
        />

        {hasError && errorMessage && (
          <p className="text-sm text-red-600">{String(errorMessage)}</p>
        )}
      </div>
    );
  }
);

InputTextarea.displayName = "InputTextarea";

export { InputTextarea };
