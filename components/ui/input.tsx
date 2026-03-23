import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        data-slot="input"
        className={cn(
          "flex h-11 w-full rounded-lg border bg-surface-card px-4 py-2.5 text-[15px] text-text-primary placeholder:text-text-muted",
          "font-sans font-medium transition-all duration-200 outline-none",
          "focus:ring-2 focus:ring-offset-1",
          "hover:border-border/80",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-light",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // Default state
          !error && !success && "border-border focus:border-brand-primary focus:ring-brand-primary/20",
          // Error state
          error && "border-error focus:border-error focus:ring-error/20 bg-error/5",
          // Success state
          success && "border-success focus:border-success focus:ring-success/20",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
