'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrgContext, checkPermission } from '@/lib/rbac'

// =============================================================
// Validation Schemas
// =============================================================

const createCampaignSchema = z.object({
  client_id: z.string().uuid('Client is required'),
  name: z.string().min(1, 'Campaign name is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  total_budget: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? Math.round(parseFloat(v) * 100) : null)),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
})

const updateCampaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  total_budget: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? Math.round(parseFloat(v) * 100) : undefined)),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
})

const createLineItemSchema = z.object({
  campaign_id: z.string().uuid(),
  channel_id: z.string().uuid('Channel is required'),
  ad_slot_id: z.string().uuid().optional().or(z.literal('')),
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z
    .string()
    .transform((v) => parseInt(v, 10))
    .refine((v) => v > 0, 'Quantity must be at least 1'),
  unit_price: z
    .string()
    .transform((v) => Math.round(parseFloat(v) * 100))
    .refine((v) => v > 0, 'Price must be greater than 0'),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
})

const updateLineItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(500).optional(),
  quantity: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  unit_price: z
    .string()
    .optional()
    .transform((v) => (v ? Math.round(parseFloat(v) * 100) : undefined)),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  status: z
    .enum(['pending', 'confirmed', 'in_production', 'scheduled', 'live', 'completed', 'cancelled'])
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
// Campaign CRUD
// =============================================================

export async function createCampaign(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'create_deals')

  const parsed = createCampaignSchema.safeParse({
    client_id: formData.get('client_id'),
    name: formData.get('name'),
    description: formData.get('description') || '',
    start_date: formData.get('start_date') || '',
    end_date: formData.get('end_date') || '',
    total_budget: formData.get('total_budget') || '',
    assigned_to: formData.get('assigned_to') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      organization_id: orgId,
      client_id: parsed.data.client_id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      start_date: parsed.data.start_date || null,
      end_date: parsed.data.end_date || null,
      total_budget: parsed.data.total_budget,
      assigned_to: parsed.data.assigned_to || null,
      created_by: user.id,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Create campaign failed:', error.message)
    return { error: { _form: ['Failed to create campaign.'] } }
  }

  revalidatePath('/dashboard/campaigns')
  return { success: true, campaignId: data.id }
}

export async function updateCampaign(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'create_deals')

  const parsed = updateCampaignSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { id, ...updates } = parsed.data
  const updatePayload: Record<string, unknown> = {}

  if (updates.name) updatePayload.name = updates.name
  if (updates.description !== undefined)
    updatePayload.description = updates.description || null
  if (updates.start_date !== undefined)
    updatePayload.start_date = updates.start_date || null
  if (updates.end_date !== undefined)
    updatePayload.end_date = updates.end_date || null
  if (updates.total_budget !== undefined)
    updatePayload.total_budget = updates.total_budget
  if (updates.status) updatePayload.status = updates.status
  if (updates.assigned_to !== undefined)
    updatePayload.assigned_to = updates.assigned_to || null

  updatePayload.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('campaigns')
    .update(updatePayload)
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Update campaign failed:', error.message)
    return { error: { _form: ['Failed to update campaign.'] } }
  }

  revalidatePath('/dashboard/campaigns')
  return { success: true }
}

export async function deleteCampaign(campaignId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_organization')

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Delete campaign failed:', error.message)
    return { error: 'Failed to delete campaign.' }
  }

  revalidatePath('/dashboard/campaigns')
  return { success: true }
}

export async function getCampaigns(statusFilter?: string) {
  const { supabase, orgId } = await getAuthOrgContext()

  let query = supabase
    .from('campaigns')
    .select('*, clients!inner(id, company_name, contact_name), line_items(count)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Get campaigns failed:', error.message)
    return []
  }

  return data ?? []
}

export async function getCampaignById(campaignId: string) {
  const { supabase, orgId } = await getAuthOrgContext()

  const { data, error } = await supabase
    .from('campaigns')
    .select(
      '*, clients!inner(id, company_name, contact_name, contact_email), line_items(*, channels(name, type))'
    )
    .eq('id', campaignId)
    .eq('organization_id', orgId)
    .single()

  if (error) {
    console.error('Get campaign failed:', error.message)
    return null
  }

  return data
}

// =============================================================
// Line Item CRUD
// =============================================================

export async function createLineItem(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'create_deals')

  const parsed = createLineItemSchema.safeParse({
    campaign_id: formData.get('campaign_id'),
    channel_id: formData.get('channel_id'),
    ad_slot_id: formData.get('ad_slot_id') || '',
    description: formData.get('description'),
    quantity: formData.get('quantity'),
    unit_price: formData.get('unit_price'),
    start_date: formData.get('start_date') || '',
    end_date: formData.get('end_date') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Verify campaign belongs to this org
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', parsed.data.campaign_id)
    .eq('organization_id', orgId)
    .single()

  if (!campaign) {
    return { error: { _form: ['Campaign not found.'] } }
  }

  const totalPrice = parsed.data.quantity * parsed.data.unit_price

  const { error } = await supabase.from('line_items').insert({
    campaign_id: parsed.data.campaign_id,
    channel_id: parsed.data.channel_id,
    ad_slot_id: parsed.data.ad_slot_id || null,
    description: parsed.data.description,
    quantity: parsed.data.quantity,
    unit_price: parsed.data.unit_price,
    total_price: totalPrice,
    start_date: parsed.data.start_date || null,
    end_date: parsed.data.end_date || null,
    status: 'pending',
  })

  if (error) {
    console.error('Create line item failed:', error.message)
    return { error: { _form: ['Failed to create line item.'] } }
  }

  revalidatePath('/dashboard/campaigns')
  return { success: true }
}

export async function updateLineItem(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'create_deals')

  const parsed = updateLineItemSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { id, ...updates } = parsed.data

  // Verify line item belongs to an org campaign
  const { data: lineItem } = await supabase
    .from('line_items')
    .select('id, quantity, unit_price, campaigns!inner(organization_id)')
    .eq('id', id)
    .single()

  if (!lineItem || (lineItem as unknown as { campaigns: { organization_id: string } }).campaigns?.organization_id !== orgId) {
    return { error: { _form: ['Line item not found.'] } }
  }

  const updatePayload: Record<string, unknown> = {}
  if (updates.description) updatePayload.description = updates.description
  if (updates.quantity !== undefined) updatePayload.quantity = updates.quantity
  if (updates.unit_price !== undefined) updatePayload.unit_price = updates.unit_price
  if (updates.start_date !== undefined)
    updatePayload.start_date = updates.start_date || null
  if (updates.end_date !== undefined)
    updatePayload.end_date = updates.end_date || null
  if (updates.status) updatePayload.status = updates.status

  // Recalculate total if quantity or price changed
  const qty = updates.quantity ?? lineItem.quantity
  const price = updates.unit_price ?? lineItem.unit_price
  updatePayload.total_price = qty * price
  updatePayload.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('line_items')
    .update(updatePayload)
    .eq('id', id)

  if (error) {
    console.error('Update line item failed:', error.message)
    return { error: { _form: ['Failed to update line item.'] } }
  }

  revalidatePath('/dashboard/campaigns')
  return { success: true }
}

export async function deleteLineItem(lineItemId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'create_deals')

  // Verify ownership
  const { data: lineItem } = await supabase
    .from('line_items')
    .select('id, campaigns!inner(organization_id)')
    .eq('id', lineItemId)
    .single()

  if (!lineItem || (lineItem as unknown as { campaigns: { organization_id: string } }).campaigns?.organization_id !== orgId) {
    return { error: 'Line item not found.' }
  }

  const { error } = await supabase
    .from('line_items')
    .delete()
    .eq('id', lineItemId)

  if (error) {
    console.error('Delete line item failed:', error.message)
    return { error: 'Failed to delete line item.' }
  }

  revalidatePath('/dashboard/campaigns')
  return { success: true }
}
