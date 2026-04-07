'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrgContext, checkPermission } from '@/lib/rbac'

// =============================================================
// Validation Schemas
// =============================================================

const createScheduleEntrySchema = z.object({
  ad_slot_id: z.string().uuid(),
  channel_id: z.string().uuid(),
  line_item_id: z.string().uuid().optional().or(z.literal('')),
  order_id: z.string().uuid().optional().or(z.literal('')),
  scheduled_date: z.string().min(1, 'Scheduled date is required'),
  scheduled_time: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

const updateScheduleEntrySchema = z.object({
  id: z.string().uuid(),
  scheduled_date: z.string().optional(),
  scheduled_time: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  status: z
    .enum(['scheduled', 'live', 'completed', 'cancelled', 'missed'])
    .optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
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
// Schedule CRUD
// =============================================================

export async function createScheduleEntry(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_channels')

  const parsed = createScheduleEntrySchema.safeParse({
    ad_slot_id: formData.get('ad_slot_id'),
    channel_id: formData.get('channel_id'),
    line_item_id: formData.get('line_item_id') || '',
    order_id: formData.get('order_id') || '',
    scheduled_date: formData.get('scheduled_date'),
    scheduled_time: formData.get('scheduled_time') || '',
    end_date: formData.get('end_date') || '',
    notes: formData.get('notes') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Conflict detection: check if slot is already booked at this date/time
  const conflictQuery = supabase
    .from('schedule_entries')
    .select('id')
    .eq('ad_slot_id', parsed.data.ad_slot_id)
    .eq('scheduled_date', parsed.data.scheduled_date)
    .neq('status', 'cancelled')

  if (parsed.data.scheduled_time) {
    conflictQuery.eq('scheduled_time', parsed.data.scheduled_time)
  }

  const { data: conflicts } = await conflictQuery

  if (conflicts && conflicts.length > 0) {
    return {
      error: {
        _form: [
          'This slot is already scheduled at the selected date/time.',
        ],
      },
    }
  }

  const { error } = await supabase.from('schedule_entries').insert({
    organization_id: orgId,
    ad_slot_id: parsed.data.ad_slot_id,
    channel_id: parsed.data.channel_id,
    line_item_id: parsed.data.line_item_id || null,
    order_id: parsed.data.order_id || null,
    scheduled_date: parsed.data.scheduled_date,
    scheduled_time: parsed.data.scheduled_time || null,
    end_date: parsed.data.end_date || null,
    notes: parsed.data.notes || null,
  })

  if (error) {
    console.error('Create schedule entry failed:', error.message)
    return { error: { _form: ['Failed to create schedule entry.'] } }
  }

  revalidatePath('/dashboard/schedule')
  return { success: true }
}

export async function updateScheduleEntry(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_channels')

  const parsed = updateScheduleEntrySchema.safeParse(
    Object.fromEntries(formData)
  )
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { id, ...updates } = parsed.data
  const updatePayload: Record<string, unknown> = {}

  if (updates.scheduled_date) updatePayload.scheduled_date = updates.scheduled_date
  if (updates.scheduled_time !== undefined)
    updatePayload.scheduled_time = updates.scheduled_time || null
  if (updates.end_date !== undefined)
    updatePayload.end_date = updates.end_date || null
  if (updates.notes !== undefined) updatePayload.notes = updates.notes || null
  if (updates.status) {
    updatePayload.status = updates.status
    if (updates.status === 'completed') {
      updatePayload.confirmed_at = new Date().toISOString()
    }
  }

  updatePayload.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('schedule_entries')
    .update(updatePayload)
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Update schedule entry failed:', error.message)
    return { error: { _form: ['Failed to update schedule entry.'] } }
  }

  revalidatePath('/dashboard/schedule')
  return { success: true }
}

export async function deleteScheduleEntry(entryId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_channels')

  const { error } = await supabase
    .from('schedule_entries')
    .delete()
    .eq('id', entryId)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Delete schedule entry failed:', error.message)
    return { error: 'Failed to delete schedule entry.' }
  }

  revalidatePath('/dashboard/schedule')
  return { success: true }
}

export async function getScheduleEntries(
  filters?: {
    channelId?: string
    startDate?: string
    endDate?: string
    status?: string
  }
) {
  const { supabase, orgId } = await getAuthOrgContext()

  let query = supabase
    .from('schedule_entries')
    .select(
      '*, channels(name, channel_type), ad_slots(label, slot_type), line_items(description, campaigns(name))'
    )
    .eq('organization_id', orgId)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })

  if (filters?.channelId) {
    query = query.eq('channel_id', filters.channelId)
  }
  if (filters?.startDate) {
    query = query.gte('scheduled_date', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte('scheduled_date', filters.endDate)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Get schedule entries failed:', error.message)
    return []
  }

  return data ?? []
}

export async function uploadProofOfRun(entryId: string, formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_channels')

  const file = formData.get('file') as File | null
  if (!file) {
    return { error: 'File is required.' }
  }

  // Get current entry
  const { data: entry } = await supabase
    .from('schedule_entries')
    .select('proof_of_run_urls')
    .eq('id', entryId)
    .eq('organization_id', orgId)
    .single()

  if (!entry) {
    return { error: 'Schedule entry not found.' }
  }

  // Upload to storage
  const filePath = `proofs/${orgId}/${entryId}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('creatives')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (uploadError) {
    console.error('Proof upload failed:', uploadError.message)
    return { error: 'Failed to upload proof.' }
  }

  const { data: urlData } = supabase.storage
    .from('creatives')
    .getPublicUrl(filePath)

  // Append URL to array
  const updatedUrls = [...(entry.proof_of_run_urls ?? []), urlData.publicUrl]

  const { error } = await supabase
    .from('schedule_entries')
    .update({
      proof_of_run_urls: updatedUrls,
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Update proof URLs failed:', error.message)
    return { error: 'Failed to save proof.' }
  }

  revalidatePath('/dashboard/schedule')
  return { success: true }
}
