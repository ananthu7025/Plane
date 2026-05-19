/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { hasFieldError, getFieldErrorMessage } from "./input-utils";

type InputCheckboxProps<T extends FieldValues> = {
  hookForm: UseFormReturn<T>;
  field: Path<T>;
  label?: string;
  description?: string;
  labelMandatory?: boolean;
  containerClassName?: string;
  labelClassName?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const InputCheckbox = React.forwardRef<
  HTMLInputElement,
  InputCheckboxProps<any>
>(
  (
    {
      hookForm,
      field,
      label,
      description,
      labelMandatory,
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
        <div className="flex items-start gap-3">
          <input
            id={String(field)}
            type="checkbox"
            className={cn(
              "h-4 w-4 rounded border border-gray-300 bg-white checked:bg-blue-500 checked:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1",
              hasError && "border-red-500 checked:bg-red-500 checked:border-red-500",
              className
            )}
            {...props}
            {...register(field)}
            ref={ref}
          />

          {label && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor={String(field)}
                className={cn(
                  "text-sm font-medium text-gray-900 cursor-pointer",
                  labelClassName
                )}
              >
                {label}
                {labelMandatory && <span className="text-red-500 ml-1">*</span>}
              </label>
              {description && (
                <p className="text-sm text-gray-500">{description}</p>
              )}
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

InputCheckbox.displayName = "InputCheckbox";

export { InputCheckbox };
