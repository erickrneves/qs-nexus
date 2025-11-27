import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-xl border border-[var(--qs-border)] bg-[var(--qs-input-bg)] px-4 py-2 text-sm text-[var(--qs-text)]",
        "placeholder:text-[var(--qs-placeholder)]",
        "transition-all duration-200",
        "hover:border-[var(--qs-border-hover)]",
        "focus:outline-none focus:border-[var(--qs-primary)] focus:ring-2 focus:ring-[var(--qs-primary)]/20",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--qs-muted)]",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--qs-text)]",
        className
      )}
      {...props}
    />
  )
}

// Glass Input variant
function GlassInput({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl px-4 py-2 text-sm text-[var(--qs-text)]",
        "placeholder:text-[var(--qs-placeholder)]",
        "transition-all duration-200",
        "hover:bg-[var(--glass-bg-strong)]",
        "focus:outline-none focus:border-[var(--qs-primary)] focus:ring-2 focus:ring-[var(--qs-primary)]/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input, GlassInput }
