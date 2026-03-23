import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-sans font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-primary text-white hover:bg-brand-primary-dark shadow-[0_1px_3px_rgba(15,100,67,0.35)] hover:shadow-[0_4px_12px_rgba(15,100,67,0.35)]",
        primary:
          "bg-brand-primary text-white hover:bg-brand-primary-dark shadow-sm hover:shadow-md",
        success:
          "bg-brand-success text-white hover:bg-brand-success-dark shadow-[0_1px_3px_rgba(15,100,67,0.35)] hover:shadow-[0_4px_12px_rgba(15,100,67,0.35)]",
        destructive:
          "bg-error text-white hover:bg-error-dark shadow-sm hover:shadow-md",
        outline:
          "border border-border text-text-primary bg-surface-card hover:bg-surface-light hover:border-brand-primary/50 hover:text-text-primary",
        secondary:
          "bg-surface-light text-text-primary hover:bg-border/60 border border-border/50",
        tertiary:
          "text-text-secondary hover:text-text-primary hover:bg-surface-light border border-transparent",
        ghost:
          "text-text-secondary hover:bg-surface-light hover:text-text-primary border border-transparent",
        link:
          "text-brand-primary underline-offset-4 hover:underline p-0 h-auto font-semibold",
        dark:
          "bg-brand-secondary text-white hover:bg-brand-secondary/90 shadow-[0_1px_3px_rgba(0,0,0,0.2)]",
        "soft-primary":
          "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 border border-brand-primary/20",
        "soft-success":
          "bg-success/10 text-success hover:bg-success/15 border border-success/20",
      },
      size: {
        default: "h-11 px-5 py-2.5 rounded-xl text-[15px]",
        sm:      "h-8 rounded-lg px-3.5 text-[13px]",
        md:      "h-10 rounded-lg px-4 text-[14px]",
        lg:      "h-12 rounded-xl px-6 text-[15px]",
        xl:      "h-14 rounded-2xl px-8 text-base",
        icon:    "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md text-sm",
        "icon-lg": "h-12 w-12 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
