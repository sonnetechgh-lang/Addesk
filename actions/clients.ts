'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrgContext, checkPermission } from '@/lib/rbac'

// =============================================================
// Validation Schemas
// =============================================================

const createClientSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200),
  contact_name: z.string().min(1, 'Contact name is required').max(200),
  contact_email: z.string().email('Valid email is required'),
  contact_phone: z.string().max(30).optional().or(z.literal('')),
  credit_terms: z.enum(['prepaid', 'net_15', 'net_30', 'net_60']).default('prepaid'),
  notes: z.string().max(2000).optional().or(z.literal('')),
  billing_line1: z.string().max(200).optional().or(z.literal('')),
  billing_city: z.string().max(100).optional().or(z.literal('')),
  billing_region: z.string().max(100).optional().or(z.literal('')),
  billing_country: z.string().max(100).optional().or(z.literal('')),
})

const updateClientSchema = z.object({
  id: z.string().uuid(),
  company_name: z.string().min(1).max(200).optional(),
  contact_name: z.string().min(1).max(200).optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().max(30).optional().or(z.literal('')),
  credit_terms: z.enum(['prepaid', 'net_15', 'net_30', 'net_60']).optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
  billing_line1: z.string().max(200).optional().or(z.literal('')),
  billing_city: z.string().max(100).optional().or(z.literal('')),
  billing_region: z.string().max(100).optional().or(z.literal('')),
  billing_country: z.string().max(100).optional().or(z.literal('')),
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
// Client CRUD
// =============================================================

export async function createClientAction(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'create_deals')

  const parsed = createClientSchema.safeParse({
    company_name: formData.get('company_name'),
    contact_name: formData.get('contact_name'),
    contact_email: formData.get('contact_email'),
    contact_phone: formData.get('contact_phone') || '',
    credit_terms: formData.get('credit_terms') || 'prepaid',
    notes: formData.get('notes') || '',
    billing_line1: formData.get('billing_line1') || '',
    billing_city: formData.get('billing_city') || '',
    billing_region: formData.get('billing_region') || '',
    billing_country: formData.get('billing_country') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const {
    billing_line1,
    billing_city,
    billing_region,
    billing_country,
    ...rest
  } = parsed.data

  const billing_address: Record<string, string> = {}
  if (billing_line1) billing_address.line1 = billing_line1
  if (billing_city) billing_address.city = billing_city
  if (billing_region) billing_address.region = billing_region
  if (billing_country) billing_address.country = billing_country

  const { data, error } = await supabase
    .from('clients')
    .insert({
      organization_id: orgId,
      company_name: rest.company_name,
      contact_name: rest.contact_name,
      contact_email: rest.contact_email,
      contact_phone: rest.contact_phone || null,
      credit_terms: rest.credit_terms,
      notes: rest.notes || null,
      billing_address,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Create client failed:', error.message)
    return { error: { _form: ['Failed to create client.'] } }
  }

  revalidatePath('/dashboard/clients')
  return { success: true, clientId: data.id }
}

export async function updateClient(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'create_deals')

  const parsed = updateClientSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const {
    id,
    billing_line1,
    billing_city,
    billing_region,
    billing_country,
    ...updates
  } = parsed.data

  const updatePayload: Record<string, unknown> = {}
  if (updates.company_name) updatePayload.company_name = updates.company_name
  if (updates.contact_name) updatePayload.contact_name = updates.contact_name
  if (updates.contact_email) updatePayload.contact_email = updates.contact_email
  if (updates.contact_phone !== undefined)
    updatePayload.contact_phone = updates.contact_phone || null
  if (updates.credit_terms) updatePayload.credit_terms = updates.credit_terms
  if (updates.notes !== undefined) updatePayload.notes = updates.notes || null

  // Rebuild billing address if any field provided
  if (billing_line1 !== undefined || billing_city !== undefined ||
      billing_region !== undefined || billing_country !== undefined) {
    const billing_address: Record<string, string> = {}
    if (billing_line1) billing_address.line1 = billing_line1
    if (billing_city) billing_address.city = billing_city
    if (billing_region) billing_address.region = billing_region
    if (billing_country) billing_address.country = billing_country
    updatePayload.billing_address = billing_address
  }

  updatePayload.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('clients')
    .update(updatePayload)
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Update client failed:', error.message)
    return { error: { _form: ['Failed to update client.'] } }
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}

export async function deleteClient(clientId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_organization')

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Delete client failed:', error.message)
    return { error: 'Failed to delete client.' }
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}

export async function getClients() {
  const { supabase, orgId } = await getAuthOrgContext()

  const { data, error } = await supabase
    .from('clients')
    .select('*, campaigns(count)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get clients failed:', error.message)
    return []
  }

  return data ?? []
}

export async function getClientById(clientId: string) {
  const { supabase, orgId } = await getAuthOrgContext()

  const { data, error } = await supabase
    .from('clients')
    .select('*, campaigns(id, name, status, total_budget, start_date, end_date)')
    .eq('id', clientId)
    .eq('organization_id', orgId)
    .single()

  if (error) {
    console.error('Get client failed:', error.message)
    return null
  }

  return data
}

export async function getClientsForSelect() {
  const { supabase, orgId } = await getAuthOrgContext()

  const { data, error } = await supabase
    .from('clients')
    .select('id, company_name, contact_name')
    .eq('organization_id', orgId)
    .order('company_name')

  if (error) {
    console.error('Get clients for select failed:', error.message)
    return []
  }

  return data ?? []
}
