import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "accent" | "signal" | "mono";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium leading-tight",
          {
            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300": variant === "default",
            "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/25 dark:text-blue-200": variant === "primary",
            "bg-brand-accent/10 text-teal-800 dark:bg-brand-accent/20 dark:text-teal-200": variant === "accent",
            "bg-signal text-white": variant === "signal",
            "font-mono uppercase tracking-wider text-[10px] bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900": variant === "mono",
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
