import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "accent";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
          {
            "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300": variant === "default",
            "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20": variant === "primary",
            "bg-brand-accent/10 text-brand-accent dark:bg-brand-accent/20": variant === "accent",
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
