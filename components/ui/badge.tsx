import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold border transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-brand-primary/10 text-brand-primary border-brand-primary/30 text-[11px] px-3 py-1",
        secondary:
          "bg-surface-light text-text-secondary border-border text-[11px] px-3 py-1",
        destructive:
          "bg-error/10 text-error border-error/30 text-[11px] px-3 py-1",
        outline:
          "border-border text-text-secondary text-[11px] px-3 py-1",
        success:
          "bg-success/10 text-success border-success/30 text-[11px] px-3 py-1",
        warning:
          "bg-warning/10 text-warning border-warning/30 text-[11px] px-3 py-1",
        info:
          "bg-info/10 text-info border-info/30 text-[11px] px-3 py-1",
        "status-new":
          "bg-status-new-bg text-status-new border-status-new/40 text-[12px] px-3 py-1.5 font-semibold",
        "status-in-progress":
          "bg-status-in-progress-bg text-status-in-progress border-status-in-progress/40 text-[12px] px-3 py-1.5 font-semibold",
        "status-submitted":
          "bg-status-submitted-bg text-status-submitted border-status-submitted/40 text-[12px] px-3 py-1.5 font-semibold",
        "status-completed":
          "bg-status-completed-bg text-status-completed border-status-completed/40 text-[12px] px-3 py-1.5 font-semibold",
        "status-cancelled":
          "bg-status-cancelled-bg text-status-cancelled border-status-cancelled/40 text-[12px] px-3 py-1.5 font-semibold",
        "soft-primary":
          "bg-brand-primary/15 text-brand-primary border-brand-primary/20 text-[11px] px-3 py-1",
        "soft-success":
          "bg-success/15 text-success border-success/20 text-[11px] px-3 py-1",
      },
      size: {
        default: "text-xs px-2.5 py-1",
        sm: "text-[10px] px-2 py-0.5",
        md: "text-sm px-3 py-1.5",
        lg: "text-base px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
