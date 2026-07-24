import React from "react";
import { Eye, EyeOff } from "lucide-react";

export interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  maxLength?: number;
  note?: string;
  isPassword?: boolean;
  showPassword?: boolean;
  setShowPassword?: (show: boolean) => void;
  registerProps?: any;
  error?: string;
  readOnly?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type,
  required = false,
  placeholder,
  icon: Icon,
  maxLength,
  note,
  isPassword = false,
  showPassword,
  setShowPassword,
  registerProps,
  error,
  readOnly = false,
}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5"
      >
        {label} {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-4 w-4 text-gray-placeholder" />
        </div>
        <input
          id={id}
          type={type}
          required={required}
          maxLength={maxLength}
          readOnly={readOnly}
          {...registerProps}
          className={`block w-full rounded-xl border ${
            error
              ? "border-error focus:ring-error/20 focus:border-error"
              : readOnly
              ? "border-gray-border bg-gray-sidebar-hover/20 text-gray-secondary-text cursor-not-allowed"
              : "border-gray-border bg-gray-card focus:border-primary focus:ring-2 focus:ring-primary/20"
          } py-2.5 pl-10 ${
            isPassword ? "pr-10" : "pr-3.5"
          } text-gray-heading-main placeholder-gray-placeholder text-sm outline-none transition-all`}
          placeholder={placeholder}
        />
        {isPassword && setShowPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-placeholder hover:text-gray-heading-small"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-xs text-error mt-1">{error}</p>
      ) : note ? (
        <p className="text-[10px] text-gray-placeholder mt-1">{note}</p>
      ) : null}
    </div>
  );
};
