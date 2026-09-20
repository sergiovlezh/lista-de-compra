import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[100px] w-full rounded-lg border border-border bg-white px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150 disabled:bg-gray-50 disabled:text-text-muted disabled:cursor-not-allowed resize-none',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }