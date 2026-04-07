'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrgContext, checkPermission } from '@/lib/rbac'

// =============================================================
// Validation Schemas
// =============================================================

const createBriefSchema = z.object({
  campaign_id: z.string().uuid().optional().or(z.literal('')),
  line_item_id: z.string().uuid().optional().or(z.literal('')),
  channel_type: z.string().min(1, 'Channel type is required'),
  title: z.string().min(1, 'Title is required').max(200),
  objective: z.string().max(2000).optional().or(z.literal('')),
  target_audience: z.string().max(1000).optional().or(z.literal('')),
  key_messages: z.string().max(2000).optional().or(z.literal('')),
  brand_guidelines_url: z.string().url().optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
})

const updateBriefSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  objective: z.string().max(2000).optional().or(z.literal('')),
  target_audience: z.string().max(1000).optional().or(z.literal('')),
  key_messages: z.string().max(2000).optional().or(z.literal('')),
  brand_guidelines_url: z.string().url().optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
  status: z
    .enum([
      'draft',
      'assigned',
      'in_production',
      'internal_review',
      'client_review',
      'approved',
      'final',
    ])
    .optional(),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
})

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
// Brief CRUD
// =============================================================

export async function createBrief(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_production')

  const parsed = createBriefSchema.safeParse({
    campaign_id: formData.get('campaign_id') || '',
    line_item_id: formData.get('line_item_id') || '',
    channel_type: formData.get('channel_type'),
    title: formData.get('title'),
    objective: formData.get('objective') || '',
    target_audience: formData.get('target_audience') || '',
    key_messages: formData.get('key_messages') || '',
    brand_guidelines_url: formData.get('brand_guidelines_url') || '',
    due_date: formData.get('due_date') || '',
    assigned_to: formData.get('assigned_to') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const status = parsed.data.assigned_to ? 'assigned' : 'draft'

  const { data, error } = await supabase
    .from('creative_briefs')
    .insert({
      organization_id: orgId,
      campaign_id: parsed.data.campaign_id || null,
      line_item_id: parsed.data.line_item_id || null,
      channel_type: parsed.data.channel_type,
      title: parsed.data.title,
      objective: parsed.data.objective || null,
      target_audience: parsed.data.target_audience || null,
      key_messages: parsed.data.key_messages || null,
      brand_guidelines_url: parsed.data.brand_guidelines_url || null,
      due_date: parsed.data.due_date || null,
      assigned_to: parsed.data.assigned_to || null,
      created_by: user.id,
      status,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Create brief failed:', error.message)
    return { error: { _form: ['Failed to create brief.'] } }
  }

  revalidatePath('/dashboard/briefs')
  return { success: true, briefId: data.id }
}

export async function updateBrief(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_production')

  const parsed = updateBriefSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { id, ...updates } = parsed.data
  const updatePayload: Record<string, unknown> = {}

  if (updates.title) updatePayload.title = updates.title
  if (updates.objective !== undefined)
    updatePayload.objective = updates.objective || null
  if (updates.target_audience !== undefined)
    updatePayload.target_audience = updates.target_audience || null
  if (updates.key_messages !== undefined)
    updatePayload.key_messages = updates.key_messages || null
  if (updates.brand_guidelines_url !== undefined)
    updatePayload.brand_guidelines_url = updates.brand_guidelines_url || null
  if (updates.due_date !== undefined)
    updatePayload.due_date = updates.due_date || null
  if (updates.status) updatePayload.status = updates.status
  if (updates.assigned_to !== undefined)
    updatePayload.assigned_to = updates.assigned_to || null

  updatePayload.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('creative_briefs')
    .update(updatePayload)
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Update brief failed:', error.message)
    return { error: { _form: ['Failed to update brief.'] } }
  }

  revalidatePath('/dashboard/briefs')
  return { success: true }
}

export async function deleteBrief(briefId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_organization')

  const { error } = await supabase
    .from('creative_briefs')
    .delete()
    .eq('id', briefId)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Delete brief failed:', error.message)
    return { error: 'Failed to delete brief.' }
  }

  revalidatePath('/dashboard/briefs')
  return { success: true }
}

export async function getBriefs(statusFilter?: string) {
  const { supabase, orgId } = await getAuthOrgContext()

  let query = supabase
    .from('creative_briefs')
    .select(
      '*, campaigns(id, name), profiles!creative_briefs_assigned_to_fkey(full_name), production_tasks(count)'
    )
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Get briefs failed:', error.message)
    return []
  }

  return data ?? []
}

export async function getBriefById(briefId: string) {
  const { supabase, orgId } = await getAuthOrgContext()

  const { data, error } = await supabase
    .from('creative_briefs')
    .select(
      '*, campaigns(id, name), production_tasks(*, profiles(full_name, profile_photo_url)), creative_files(*)'
    )
    .eq('id', briefId)
    .eq('organization_id', orgId)
    .single()

  if (error) {
    console.error('Get brief failed:', error.message)
    return null
  }

  return data
}
