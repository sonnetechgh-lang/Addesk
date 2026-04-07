import {
  Megaphone,
  Newspaper,
  Monitor,
  Tv,
  Radio,
} from 'lucide-react'
import type { ChannelType } from '@/types/channels'
import { cn } from '@/lib/utils'

const iconMap: Record<ChannelType, React.ComponentType<{ className?: string }>> = {
  influencer: Megaphone,
  print: Newspaper,
  digital: Monitor,
  broadcast_tv: Tv,
  broadcast_radio: Radio,
}

const colorMap: Record<ChannelType, string> = {
  influencer: 'bg-purple-50 text-purple-600',
  print: 'bg-amber-50 text-amber-600',
  digital: 'bg-blue-50 text-blue-600',
  broadcast_tv: 'bg-rose-50 text-rose-600',
  broadcast_radio: 'bg-teal-50 text-teal-600',
}

export function ChannelTypeIcon({
  type,
  size = 'md',
  className,
}: {
  type: ChannelType
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const Icon = iconMap[type] ?? Megaphone
  const sizeClasses = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-14 w-14 rounded-2xl',
  }
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0',
        sizeClasses[size],
        colorMap[type],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
    </div>
  )
}
