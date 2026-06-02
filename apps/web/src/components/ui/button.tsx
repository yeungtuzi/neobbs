import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50",
        size === "default" && "h-8 gap-1.5 px-3",
        size === "sm" && "h-7 gap-1 px-2.5 text-xs",
        size === "lg" && "h-9 gap-1.5 px-4",
        variant === "default" && "bg-[var(--accent-cyan)] text-white hover:opacity-80",
        variant === "outline" && "border border-[var(--text-secondary)]/20 bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-primary)]",
        className,
      )}
      {...props}
    />
  );
}

export { Button };
