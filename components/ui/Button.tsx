import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          "rounded-lg font-semibold transition-colors inline-flex items-center justify-center",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          {
            // Variants
            "bg-brand-primary-light hover:bg-brand-primary text-white":
              variant === "primary",
            "bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white":
              variant === "secondary",
            "bg-brand-accent hover:bg-teal-600 text-white":
              variant === "accent",
            "bg-red-600 hover:bg-red-700 text-white": variant === "danger",

            // Sizes
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-base": size === "md",
            "px-6 py-3 text-lg": size === "lg",

            // Full width
            "w-full": fullWidth,
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
