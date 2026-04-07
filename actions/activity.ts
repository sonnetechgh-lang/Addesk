'use server'

import { createClient } from '@/lib/supabase/server'
import { getOrgContext } from '@/lib/rbac'
import type { EntityType, ActionType } from '@/types/campaigns'

// =============================================================
// Helpers
// =============================================================

async function getAuthOrgContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const ctx = await getOrgContext(user.id)
  if (!ctx?.orgId) throw new Error('No organization selected')

  return { supabase, user, orgId: ctx.orgId }
}

// =============================================================
// Activity Log
// =============================================================

export async function logActivity(
  entityType: EntityType,
  entityId: string,
  action: ActionType,
  details?: Record<string, unknown>
) {
  const { supabase, user, orgId } = await getAuthOrgContext()

  const { error } = await supabase.from('activity_log').insert({
    organization_id: orgId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor_id: user.id,
    details: details ?? {},
  })

  if (error) {
    console.error('Log activity failed:', error.message)
  }
}

export async function getActivityForEntity(
  entityType: string,
  entityId: string
) {
  const { supabase } = await getAuthOrgContext()

  const { data, error } = await supabase
    .from('activity_log')
    .select('*, profiles(full_name, profile_photo_url)')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Get activity failed:', error.message)
    return []
  }

  return data ?? []
}

export async function getRecentActivity(limit = 20) {
  const { supabase, orgId } = await getAuthOrgContext()

  const { data, error } = await supabase
    .from('activity_log')
    .select('*, profiles(full_name, profile_photo_url)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Get recent activity failed:', error.message)
    return []
  }

  return data ?? []
}
