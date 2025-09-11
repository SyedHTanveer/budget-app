import * as React from 'react'
import { cn } from '../../lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn('flex h-9 w-full rounded-md bg-neutral-50 px-3 py-1.5 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50', className)}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'
