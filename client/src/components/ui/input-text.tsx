/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { hasFieldError, getFieldErrorMessage } from "./input-utils";

type TextTransformMode = "capitalize" | "uppercase" | "lowercase" | "none";

type InputTextProps<T extends FieldValues> = {
  hookForm: UseFormReturn<T>;
  field: Path<T>;
  label: string;
  errorText?: string;
  labelMandatory?: boolean;
  infoText?: string;
  showInfoIcon?: boolean;
  textTransformMode?: TextTransformMode;
  onConditionCheck?: (newValue: string, oldValue: string) => boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  containerClassName?: string;
  labelClassName?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const InputText = React.forwardRef<
  HTMLInputElement,
  InputTextProps<any>
>(
  (
    {
      hookForm,
      field,
      label,
      labelMandatory,
      infoText,
      showInfoIcon,
      textTransformMode = "none",
      onConditionCheck,
      icon,
      iconPosition = "left",
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
      setValue,
      getValues,
    } = hookForm;

    const hasError = hasFieldError(errors, field);
    const errorMessage = getFieldErrorMessage(errors, field);

    const textTransformHandler = (value: string) => {
      switch (textTransformMode) {
        case "capitalize":
          return value.length > 0
            ? value.charAt(0).toUpperCase() + value.slice(1)
            : value;
        case "uppercase":
          return value.toUpperCase();
        case "lowercase":
          return value.toLowerCase();
        default:
          return value;
      }
    };

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

        <div className="relative">
          <input
            id={String(field)}
            className={cn(
              "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors",
              hasError
                ? "border-red-500 bg-red-50 focus-visible:ring-red-500"
                : "border-input focus-visible:ring-ring",
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10",
              className
            )}
            {...register(field, {
              onChange: (e) => {
                const oldValue = getValues(field) as string;
                const newValue = textTransformHandler(e.target.value);
                if (onConditionCheck && !onConditionCheck(newValue, oldValue)) {
                  e.preventDefault();
                  return;
                }

                setValue(field, newValue as any, { shouldValidate: true });
              },
            })}
            {...props}
            ref={ref}
          />

          {icon && (
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none flex items-center justify-center",
                iconPosition === "left" ? "left-3" : "right-3"
              )}
            >
              {icon}
            </div>
          )}
        </div>

        {hasError && errorMessage && (
          <p className="text-sm text-red-600">{String(errorMessage)}</p>
        )}
      </div>
    );
  }
);

InputText.displayName = "InputText";

export { InputText };
