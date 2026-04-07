import { cn } from "@/lib/utils"

const sizes = {
  sm: { container: "w-5 h-5", dot: "w-2 h-2" },
  md: { container: "w-6 h-6", dot: "w-2.5 h-2.5" },
  lg: { container: "w-8 h-8", dot: "w-3.5 h-3.5" },
}

interface LogoProps {
  size?: keyof typeof sizes
  variant?: "default" | "dark"
  className?: string
}

export function LogoMark({ size = "md", variant = "default", className }: LogoProps) {
  const s = sizes[size]
  const secondary = variant === "dark" ? "bg-white/40" : "bg-brand-secondary"

  return (
    <div className={cn("grid grid-cols-2 gap-0.5 items-center justify-center", s.container, className)}>
      <div className={cn("rounded-full bg-brand-success", s.dot)} />
      <div className={cn("rounded-full", secondary, s.dot)} />
      <div className={cn("rounded-full", secondary, s.dot)} />
      <div className={cn("rounded-full", secondary, s.dot)} />
    </div>
  )
}
