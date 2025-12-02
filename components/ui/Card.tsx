import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "bg-white dark:bg-slate-800 rounded-2xl",
          {
            "shadow-sm border border-slate-200 dark:border-slate-700": variant === "default",
            "shadow-md dark:shadow-slate-900/50": variant === "elevated",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
