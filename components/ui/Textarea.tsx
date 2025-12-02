import { TextareaHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth = false, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={clsx("flex flex-col gap-1", { "w-full": fullWidth })}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            "px-3 py-2 border rounded-lg text-sm resize-y",
            "bg-white dark:bg-slate-700 text-slate-900 dark:text-white",
            "focus:outline-none focus:ring-2 focus:ring-brand-primary-light focus:border-transparent",
            "disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed",
            {
              "border-red-500 dark:border-red-500": error,
              "border-slate-300 dark:border-slate-600": !error,
            },
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
