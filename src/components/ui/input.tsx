import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'w-full rounded-lg border border-border bg-white px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150 disabled:bg-gray-50 disabled:text-text-muted disabled:cursor-not-allowed',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }