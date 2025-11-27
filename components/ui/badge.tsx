import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors cursor-default select-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--qs-primary)] text-white',
        secondary: 'border-transparent bg-[var(--qs-muted)] text-[var(--qs-text-secondary)]',
        destructive: 'border-transparent bg-[var(--qs-error)] text-white',
        outline: 'border-[var(--qs-border)] text-[var(--qs-text)] bg-transparent',
        success: 'border-transparent bg-[var(--qs-success-light)] text-[var(--qs-success)]',
        warning: 'border-transparent bg-[var(--qs-warning-light)] text-[var(--qs-warning)]',
        info: 'border-transparent bg-[var(--qs-info-light)] text-[var(--qs-info)]',
        brand: 'border-transparent bg-[var(--qs-brand-light)] text-[var(--qs-brand)]',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { Badge, badgeVariants }
