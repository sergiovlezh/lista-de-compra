import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary-light text-primary hover:bg-primary-light/80',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        destructive: 'bg-destructive-light text-destructive hover:bg-destructive-light/80',
        outline: 'border border-border text-text',
        success: 'bg-green-50 text-green-700 hover:bg-green-100',
        warning: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }