import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "danger" | "ghost";
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
          "rounded-md font-medium transition-colors inline-flex items-center justify-center whitespace-nowrap",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-light focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          {
            // Variants
            "bg-brand-primary hover:bg-brand-secondary text-white":
              variant === "primary",
            "bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-600":
              variant === "secondary",
            "bg-brand-accent hover:bg-teal-700 text-white":
              variant === "accent",
            "bg-red-600 hover:bg-red-700 text-white": variant === "danger",
            "bg-transparent hover:bg-slate-100 text-slate-700 dark:text-slate-200 dark:hover:bg-slate-800":
              variant === "ghost",

            // Sizes
            "px-2.5 py-1.5 text-xs": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-5 py-3 text-base": size === "lg",

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
