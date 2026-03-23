'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function recordProfileView(profileId: string) {
  if (!profileId) return

  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'

  const supabase = createAdminClient()

  // Rate-limit: skip if same IP viewed this profile in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data: recent } = await supabase
    .from('profile_views')
    .select('id')
    .eq('profile_id', profileId)
    .eq('viewer_ip', ip)
    .gte('created_at', oneHourAgo)
    .limit(1)

  if (recent && recent.length > 0) return

  await supabase
    .from('profile_views')
    .insert({ profile_id: profileId, viewer_ip: ip })
}
