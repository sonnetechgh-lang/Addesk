'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrgContext } from '@/lib/rbac'
import { checkPermission } from '@/lib/rbac'
import { CHANNEL_TYPES, SLOT_TYPES } from '@/types/channels'

// =============================================================
// Validation Schemas
// =============================================================

const createChannelSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  type: z.enum(CHANNEL_TYPES),
  description: z.string().max(1000).optional().or(z.literal('')),
})

const updateChannelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional().or(z.literal('')),
  is_active: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
})

const createSlotSchema = z.object({
  channel_id: z.string().uuid(),
  name: z.string().min(2, 'Name is required').max(200),
  slot_type: z.enum(SLOT_TYPES),
  base_price: z
    .string()
    .transform((v) => Math.round(parseFloat(v) * 100))
    .refine((v) => v > 0, 'Price must be greater than 0'),
  specs: z.string().optional().default('{}'),
  max_units_per_period: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : null)),
})

const updateSlotSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(200).optional(),
  base_price: z
    .string()
    .optional()
    .transform((v) => (v ? Math.round(parseFloat(v) * 100) : undefined)),
  specs: z.string().optional(),
  max_units_per_period: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : null)),
  is_active: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
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
// Channel Actions
// =============================================================

export async function createChannel(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_channels')

  const parsed = createChannelSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    description: formData.get('description') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase.from('channels').insert({
    organization_id: orgId,
    name: parsed.data.name,
    type: parsed.data.type,
    description: parsed.data.description || null,
  })

  if (error) {
    console.error('Create channel failed:', error.message)
    return { error: { _form: ['Failed to create channel.'] } }
  }

  revalidatePath('/dashboard/channels')
  return { success: true }
}

export async function updateChannel(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_channels')

  const parsed = updateChannelSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { id, ...updates } = parsed.data

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (updates.name !== undefined) updatePayload.name = updates.name
  if (updates.description !== undefined)
    updatePayload.description = updates.description || null
  if (updates.is_active !== undefined) updatePayload.is_active = updates.is_active

  const { error } = await supabase
    .from('channels')
    .update(updatePayload)
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Update channel failed:', error.message)
    return { error: { _form: ['Failed to update channel.'] } }
  }

  revalidatePath('/dashboard/channels')
  return { success: true }
}

export async function deleteChannel(channelId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_channels')

  const { error } = await supabase
    .from('channels')
    .delete()
    .eq('id', channelId)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Delete channel failed:', error.message)
    return { error: 'Failed to delete channel.' }
  }

  revalidatePath('/dashboard/channels')
  return { success: true }
}

export async function getChannels() {
  const { supabase, orgId } = await getAuthOrgContext()

  const { data, error } = await supabase
    .from('channels')
    .select('*, ad_slots(count)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get channels failed:', error.message)
    return []
  }

  return data ?? []
}

export async function getChannelWithSlots(channelId: string) {
  const { supabase, orgId } = await getAuthOrgContext()

  const { data, error } = await supabase
    .from('channels')
    .select('*, ad_slots(*, rate_cards(*))')
    .eq('id', channelId)
    .eq('organization_id', orgId)
    .single()

  if (error) {
    console.error('Get channel failed:', error.message)
    return null
  }

  return data
}

// =============================================================
// Ad Slot Actions
// =============================================================

export async function createSlot(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_inventory')

  const parsed = createSlotSchema.safeParse({
    channel_id: formData.get('channel_id'),
    name: formData.get('name'),
    slot_type: formData.get('slot_type'),
    base_price: formData.get('base_price'),
    specs: formData.get('specs') || '{}',
    max_units_per_period: formData.get('max_units_per_period') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  let specs: Record<string, unknown> = {}
  try {
    specs = JSON.parse(parsed.data.specs)
  } catch {
    return { error: { specs: ['Invalid specs format'] } }
  }

  const { error } = await supabase.from('ad_slots').insert({
    channel_id: parsed.data.channel_id,
    organization_id: orgId,
    name: parsed.data.name,
    slot_type: parsed.data.slot_type,
    base_price: parsed.data.base_price,
    specs,
    max_units_per_period: parsed.data.max_units_per_period,
  })

  if (error) {
    console.error('Create slot failed:', error.message)
    return { error: { _form: ['Failed to create ad slot.'] } }
  }

  revalidatePath('/dashboard/channels')
  return { success: true }
}

export async function updateSlot(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_inventory')

  const parsed = updateSlotSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { id, ...updates } = parsed.data

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (updates.name !== undefined) updatePayload.name = updates.name
  if (updates.base_price !== undefined) updatePayload.base_price = updates.base_price
  if (updates.max_units_per_period !== undefined)
    updatePayload.max_units_per_period = updates.max_units_per_period
  if (updates.is_active !== undefined) updatePayload.is_active = updates.is_active

  if (updates.specs) {
    try {
      updatePayload.specs = JSON.parse(updates.specs)
    } catch {
      return { error: { specs: ['Invalid specs format'] } }
    }
  }

  const { error } = await supabase
    .from('ad_slots')
    .update(updatePayload)
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Update slot failed:', error.message)
    return { error: { _form: ['Failed to update ad slot.'] } }
  }

  revalidatePath('/dashboard/channels')
  return { success: true }
}

export async function deleteSlot(slotId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_inventory')

  const { error } = await supabase
    .from('ad_slots')
    .delete()
    .eq('id', slotId)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Delete slot failed:', error.message)
    return { error: 'Failed to delete ad slot.' }
  }

  revalidatePath('/dashboard/channels')
  return { success: true }
}
