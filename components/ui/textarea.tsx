import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  success?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, success, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          "flex min-h-25 w-full rounded-lg border bg-surface-card px-4 py-3 text-[15px] font-sans text-text-primary placeholder:text-text-muted",
          "font-medium transition-all duration-200 outline-none resize-none",
          "focus:ring-2 focus:ring-offset-1",
          "hover:border-border/80",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-light",
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
Textarea.displayName = "Textarea"

export { Textarea }
