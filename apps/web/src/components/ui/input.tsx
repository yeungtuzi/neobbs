import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-lg border border-[var(--text-secondary)]/20 bg-[var(--bg-primary)] px-3 py-1 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] transition-colors outline-none focus-visible:border-[var(--accent-cyan)] focus-visible:ring-1 focus-visible:ring-[var(--accent-cyan)]/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
