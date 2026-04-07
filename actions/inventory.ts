'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrgContext, checkPermission } from '@/lib/rbac'

// =============================================================
// Validation Schemas
// =============================================================

const createRateCardSchema = z.object({
  ad_slot_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  price: z
    .string()
    .transform((v) => Math.round(parseFloat(v) * 100))
    .refine((v) => v > 0, 'Price must be greater than 0'),
  valid_from: z.string().optional().or(z.literal('')),
  valid_to: z.string().optional().or(z.literal('')),
  is_default: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
})

const updateRateCardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  price: z
    .string()
    .optional()
    .transform((v) => (v ? Math.round(parseFloat(v) * 100) : undefined)),
  valid_from: z.string().optional().or(z.literal('')),
  valid_to: z.string().optional().or(z.literal('')),
  is_default: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
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
// Rate Card Actions
// =============================================================

export async function createRateCard(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_inventory')

  const parsed = createRateCardSchema.safeParse({
    ad_slot_id: formData.get('ad_slot_id'),
    name: formData.get('name'),
    price: formData.get('price'),
    valid_from: formData.get('valid_from') || '',
    valid_to: formData.get('valid_to') || '',
    is_default: formData.get('is_default') || 'false',
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Verify the slot belongs to this org
  const { data: slot } = await supabase
    .from('ad_slots')
    .select('id')
    .eq('id', parsed.data.ad_slot_id)
    .eq('organization_id', orgId)
    .single()

  if (!slot) {
    return { error: { _form: ['Ad slot not found.'] } }
  }

  // If setting as default, unset other defaults for this slot
  if (parsed.data.is_default) {
    await supabase
      .from('rate_cards')
      .update({ is_default: false })
      .eq('ad_slot_id', parsed.data.ad_slot_id)
  }

  const { error } = await supabase.from('rate_cards').insert({
    ad_slot_id: parsed.data.ad_slot_id,
    name: parsed.data.name,
    price: parsed.data.price,
    valid_from: parsed.data.valid_from || null,
    valid_to: parsed.data.valid_to || null,
    is_default: parsed.data.is_default,
  })

  if (error) {
    console.error('Create rate card failed:', error.message)
    return { error: { _form: ['Failed to create rate card.'] } }
  }

  revalidatePath('/dashboard/channels')
  return { success: true }
}

export async function updateRateCard(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_inventory')

  const parsed = updateRateCardSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { id, ...updates } = parsed.data

  // Verify the rate card belongs to a slot in this org
  const { data: rateCard } = await supabase
    .from('rate_cards')
    .select('ad_slot_id, ad_slots!inner(organization_id)')
    .eq('id', id)
    .single()

  if (!rateCard || (rateCard as unknown as { ad_slots: { organization_id: string } }).ad_slots?.organization_id !== orgId) {
    return { error: { _form: ['Rate card not found.'] } }
  }

  const updatePayload: Record<string, unknown> = {}
  if (updates.name !== undefined) updatePayload.name = updates.name
  if (updates.price !== undefined) updatePayload.price = updates.price
  if (updates.valid_from !== undefined)
    updatePayload.valid_from = updates.valid_from || null
  if (updates.valid_to !== undefined)
    updatePayload.valid_to = updates.valid_to || null
  if (updates.is_default !== undefined) {
    updatePayload.is_default = updates.is_default
    // If setting as default, unset others
    if (updates.is_default) {
      await supabase
        .from('rate_cards')
        .update({ is_default: false })
        .eq('ad_slot_id', rateCard.ad_slot_id)
        .neq('id', id)
    }
  }

  const { error } = await supabase
    .from('rate_cards')
    .update(updatePayload)
    .eq('id', id)

  if (error) {
    console.error('Update rate card failed:', error.message)
    return { error: { _form: ['Failed to update rate card.'] } }
  }

  revalidatePath('/dashboard/channels')
  return { success: true }
}

export async function deleteRateCard(rateCardId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_inventory')

  // Verify ownership via slot → org
  const { data: rateCard } = await supabase
    .from('rate_cards')
    .select('id, ad_slots!inner(organization_id)')
    .eq('id', rateCardId)
    .single()

  if (!rateCard || (rateCard as unknown as { ad_slots: { organization_id: string } }).ad_slots?.organization_id !== orgId) {
    return { error: 'Rate card not found.' }
  }

  const { error } = await supabase
    .from('rate_cards')
    .delete()
    .eq('id', rateCardId)

  if (error) {
    console.error('Delete rate card failed:', error.message)
    return { error: 'Failed to delete rate card.' }
  }

  revalidatePath('/dashboard/channels')
  return { success: true }
}

// =============================================================
// Inventory Overview
// =============================================================

export async function getInventoryOverview() {
  const { supabase, orgId } = await getAuthOrgContext()

  const { data, error } = await supabase
    .from('ad_slots')
    .select('*, channels!inner(name, type), rate_cards(*)')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get inventory failed:', error.message)
    return []
  }

  return data ?? []
}
