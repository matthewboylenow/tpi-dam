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
            "bg-slate-100 text-slate-700": variant === "default",
            "bg-brand-primary/10 text-brand-primary": variant === "primary",
            "bg-brand-accent/10 text-brand-accent": variant === "accent",
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
