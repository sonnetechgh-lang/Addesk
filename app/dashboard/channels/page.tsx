import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getChannels } from '@/actions/channels'
import { ChannelTypeIcon } from '@/components/dashboard/ChannelTypeIcon'
import { CHANNEL_TYPE_LABELS } from '@/types/channels'
import type { ChannelType } from '@/types/channels'
import { createClient } from '@/lib/supabase/server'

export default async function ChannelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const channels = await getChannels()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Channels</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your advertising channels and inventory.
          </p>
        </div>
        <Link
          href="/dashboard/channels/new"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Channel
        </Link>
      </div>

      {/* Channel List */}
      {channels.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
            <Plus className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">No channels yet</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Create your first channel to start managing ad inventory.
          </p>
          <Link
            href="/dashboard/channels/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Channel
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel: {
            id: string
            name: string
            type: string
            description: string | null
            is_active: boolean
            ad_slots: { count: number }[]
          }) => {
            const slotCount = channel.ad_slots?.[0]?.count ?? 0
            return (
              <Link
                key={channel.id}
                href={`/dashboard/channels/${channel.id}`}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <ChannelTypeIcon type={channel.type as ChannelType} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-zinc-900 truncate group-hover:text-emerald-700 transition-colors">
                        {channel.name}
                      </h3>
                      <span
                        className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          channel.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {channel.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {CHANNEL_TYPE_LABELS[channel.type as ChannelType] ?? channel.type}
                    </p>
                    {channel.description && (
                      <p className="mt-1.5 text-sm text-zinc-500 line-clamp-2">
                        {channel.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-medium text-zinc-400">
                      {slotCount} {slotCount === 1 ? 'slot' : 'slots'}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
