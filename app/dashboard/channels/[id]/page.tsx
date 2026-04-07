import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getChannelWithSlots } from '@/actions/channels'
import { ChannelTypeIcon } from '@/components/dashboard/ChannelTypeIcon'
import { CHANNEL_TYPE_LABELS } from '@/types/channels'
import type { ChannelType } from '@/types/channels'
import { ChannelDetailClient } from './client'

export default async function ChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const channel = await getChannelWithSlots(id)
  if (!channel) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/dashboard/channels"
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <ChannelTypeIcon type={channel.type as ChannelType} size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{channel.name}</h1>
              <p className="text-sm text-zinc-500">
                {CHANNEL_TYPE_LABELS[channel.type as ChannelType]}
                <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  channel.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {channel.is_active ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
          </div>
          {channel.description && (
            <p className="mt-2 text-sm text-zinc-500 max-w-2xl">{channel.description}</p>
          )}
        </div>
      </div>

      {/* Client component handles interactive slot/rate card management */}
      <ChannelDetailClient
        channel={channel}
        slots={channel.ad_slots ?? []}
      />
    </div>
  )
}
