import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium cursor-pointer select-none transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-gradient-primary text-white",
        destructive: "bg-[var(--qs-error)] text-white shadow-sm hover:bg-[var(--qs-error)]/90 focus-visible:ring-[var(--qs-error)]",
        outline: "border border-[var(--qs-border)] bg-[var(--qs-card)] text-[var(--qs-text)] shadow-sm hover:bg-[var(--qs-muted)] hover:border-[var(--qs-border-hover)] focus-visible:ring-[var(--qs-green)]",
        secondary: "bg-[var(--qs-muted)] text-[var(--qs-text-secondary)] hover:bg-[var(--qs-border)] hover:text-[var(--qs-text)] focus-visible:ring-[var(--qs-green)]",
        ghost: "text-[var(--qs-text-secondary)] hover:bg-[var(--qs-muted)] hover:text-[var(--qs-text)] focus-visible:ring-[var(--qs-green)]",
        link: "text-[var(--qs-green)] underline-offset-4 hover:underline focus-visible:ring-[var(--qs-green)]",
        brand: "btn-gradient-brand text-[#1e293b] font-semibold",
        accent: "btn-gradient-accent text-white",
        success: "bg-[var(--qs-success)] text-white shadow-sm hover:brightness-110 focus-visible:ring-[var(--qs-success)]",
        glass: "bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] text-[var(--qs-text)] shadow-[var(--glass-shadow)] hover:bg-[var(--glass-bg-strong)] focus-visible:ring-[var(--qs-green)]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-11 px-6",
        xl: "h-12 px-8 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
