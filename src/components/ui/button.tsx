import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-hover/90',
        destructive: 'bg-destructive text-white hover:bg-destructive-hover active:bg-destructive-hover/90',
        outline: 'border-2 border-primary text-primary hover:bg-primary-light active:bg-primary-light/90',
        secondary: 'bg-secondary text-white hover:bg-secondary-hover active:bg-secondary-hover/90',
        ghost: 'text-primary hover:bg-primary-light active:bg-primary-light/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-4',
        sm: 'h-10 px-3 text-xs',
        lg: 'h-14 px-6 text-base',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }