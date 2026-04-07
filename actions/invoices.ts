'use server'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrgContext, checkPermission } from '@/lib/rbac'
import { generateInvoiceNumber } from '@/lib/invoice-number'
import { sendInvoiceEmail } from '@/lib/email/invoice'

// =============================================================
// Validation Schemas
// =============================================================

const createInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  campaign_id: z.string().uuid().optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
  tax_amount: z.coerce.number().int().min(0).default(0),
  discount_amount: z.coerce.number().int().min(0).default(0),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

const lineItemSchema = z.object({
  invoice_id: z.string().uuid(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().int().min(1).default(1),
  unit_price: z.coerce.number().int().min(0),
  line_item_id: z.string().uuid().optional().or(z.literal('')),
  order_id: z.string().uuid().optional().or(z.literal('')),
  schedule_entry_id: z.string().uuid().optional().or(z.literal('')),
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

function recalcTotals(
  lineItems: { quantity: number; unit_price: number }[],
  taxAmount: number,
  discountAmount: number
) {
  const subtotal = lineItems.reduce(
    (sum, li) => sum + li.quantity * li.unit_price,
    0
  )
  const total = subtotal + taxAmount - discountAmount
  return { subtotal, total: Math.max(total, 0) }
}

// =============================================================
// Invoice CRUD
// =============================================================

export async function createInvoice(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_billing')

  const parsed = createInvoiceSchema.safeParse({
    client_id: formData.get('client_id'),
    campaign_id: formData.get('campaign_id') || '',
    due_date: formData.get('due_date') || '',
    tax_amount: formData.get('tax_amount') || 0,
    discount_amount: formData.get('discount_amount') || 0,
    notes: formData.get('notes') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const invoiceNumber = await generateInvoiceNumber(orgId)

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      organization_id: orgId,
      client_id: parsed.data.client_id,
      campaign_id: parsed.data.campaign_id || null,
      invoice_number: invoiceNumber,
      subtotal: 0,
      tax_amount: parsed.data.tax_amount,
      discount_amount: parsed.data.discount_amount,
      total: 0,
      due_date: parsed.data.due_date || null,
      notes: parsed.data.notes || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Create invoice failed:', error.message)
    return { error: { _form: ['Failed to create invoice.'] } }
  }

  revalidatePath('/dashboard/billing')
  return { success: true, invoiceId: data.id }
}

export async function updateInvoice(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_billing')

  const id = formData.get('id') as string
  if (!id) return { error: { _form: ['Invoice ID is required.'] } }

  const updates: Record<string, unknown> = {}

  const status = formData.get('status') as string
  if (status) {
    updates.status = status
    if (status === 'sent' && !formData.get('issued_date')) {
      updates.issued_date = new Date().toISOString().split('T')[0]
    }
    if (status === 'paid') {
      updates.paid_date = new Date().toISOString().split('T')[0]
    }
  }

  const dueDate = formData.get('due_date') as string
  if (dueDate !== undefined) updates.due_date = dueDate || null

  const issuedDate = formData.get('issued_date') as string
  if (issuedDate !== undefined) updates.issued_date = issuedDate || null

  const taxAmount = formData.get('tax_amount')
  if (taxAmount !== null) updates.tax_amount = parseInt(taxAmount as string, 10) || 0

  const discountAmount = formData.get('discount_amount')
  if (discountAmount !== null)
    updates.discount_amount = parseInt(discountAmount as string, 10) || 0

  const notes = formData.get('notes') as string
  if (notes !== undefined) updates.notes = notes || null

  updates.updated_at = new Date().toISOString()

  // If tax or discount changed, recalc totals
  if (taxAmount !== null || discountAmount !== null) {
    const { data: lineItems } = await supabase
      .from('invoice_line_items')
      .select('quantity, unit_price')
      .eq('invoice_id', id)

    if (lineItems) {
      const tax = updates.tax_amount as number ?? 0
      const disc = updates.discount_amount as number ?? 0
      const { subtotal, total } = recalcTotals(lineItems, tax, disc)
      updates.subtotal = subtotal
      updates.total = total
    }
  }

  const { error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Update invoice failed:', error.message)
    return { error: { _form: ['Failed to update invoice.'] } }
  }

  revalidatePath('/dashboard/billing')
  return { success: true }
}

export async function deleteInvoice(invoiceId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_billing')

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Delete invoice failed:', error.message)
    return { error: 'Failed to delete invoice.' }
  }

  revalidatePath('/dashboard/billing')
  return { success: true }
}

export async function getInvoices(statusFilter?: string) {
  const { supabase, orgId } = await getAuthOrgContext()

  let query = supabase
    .from('invoices')
    .select(
      '*, clients(company_name, contact_name), campaigns(name), payments(amount, status)'
    )
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Get invoices failed:', error.message)
    return []
  }

  // Calculate paid totals
  return (data ?? []).map((inv) => ({
    ...inv,
    _paid_total: (inv.payments ?? [])
      .filter((p: { status: string; amount: number }) => p.status === 'completed')
      .reduce((sum: number, p: { status: string; amount: number }) => sum + p.amount, 0),
  }))
}

export async function getInvoiceById(invoiceId: string) {
  const { supabase, orgId } = await getAuthOrgContext()

  const { data, error } = await supabase
    .from('invoices')
    .select(
      '*, clients(company_name, contact_name, contact_email, billing_address), campaigns(name), invoice_line_items(*), payments(*, profiles(full_name))'
    )
    .eq('id', invoiceId)
    .eq('organization_id', orgId)
    .single()

  if (error) {
    console.error('Get invoice failed:', error.message)
    return null
  }

  return data
}

export async function getInvoiceByToken(token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select(
      '*, clients(company_name, contact_name, contact_email, billing_address), campaigns(name), invoice_line_items(*), organizations(name, logo_url)'
    )
    .eq('view_token', token)
    .single()

  if (error) {
    console.error('Get invoice by token failed:', error.message)
    return null
  }

  // Mark as viewed if sent
  if (data && data.status === 'sent') {
    await supabase
      .from('invoices')
      .update({ status: 'viewed', updated_at: new Date().toISOString() })
      .eq('id', data.id)
  }

  return data
}

// =============================================================
// Invoice Line Item Operations
// =============================================================

export async function addInvoiceLineItem(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_billing')

  const parsed = lineItemSchema.safeParse({
    invoice_id: formData.get('invoice_id'),
    description: formData.get('description'),
    quantity: formData.get('quantity') || 1,
    unit_price: formData.get('unit_price'),
    line_item_id: formData.get('line_item_id') || '',
    order_id: formData.get('order_id') || '',
    schedule_entry_id: formData.get('schedule_entry_id') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const totalPrice = parsed.data.quantity * parsed.data.unit_price

  const { error } = await supabase.from('invoice_line_items').insert({
    invoice_id: parsed.data.invoice_id,
    description: parsed.data.description,
    quantity: parsed.data.quantity,
    unit_price: parsed.data.unit_price,
    total_price: totalPrice,
    line_item_id: parsed.data.line_item_id || null,
    order_id: parsed.data.order_id || null,
    schedule_entry_id: parsed.data.schedule_entry_id || null,
  })

  if (error) {
    console.error('Add line item failed:', error.message)
    return { error: { _form: ['Failed to add line item.'] } }
  }

  // Recalc invoice totals
  await recalcInvoiceTotals(supabase, parsed.data.invoice_id, orgId)

  revalidatePath('/dashboard/billing')
  return { success: true }
}

export async function deleteInvoiceLineItem(lineItemId: string, invoiceId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_billing')

  const { error } = await supabase
    .from('invoice_line_items')
    .delete()
    .eq('id', lineItemId)

  if (error) {
    console.error('Delete line item failed:', error.message)
    return { error: 'Failed to delete line item.' }
  }

  await recalcInvoiceTotals(supabase, invoiceId, orgId)

  revalidatePath('/dashboard/billing')
  return { success: true }
}

async function recalcInvoiceTotals(
  supabase: SupabaseClient,
  invoiceId: string,
  orgId: string
) {
  const { data: lineItems } = await supabase
    .from('invoice_line_items')
    .select('quantity, unit_price')
    .eq('invoice_id', invoiceId)

  const { data: invoice } = await supabase
    .from('invoices')
    .select('tax_amount, discount_amount')
    .eq('id', invoiceId)
    .single()

  if (lineItems && invoice) {
    const { subtotal, total } = recalcTotals(
      lineItems,
      invoice.tax_amount ?? 0,
      invoice.discount_amount ?? 0
    )
    await supabase
      .from('invoices')
      .update({ subtotal, total, updated_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .eq('organization_id', orgId)
  }
}

// =============================================================
// Send Invoice
// =============================================================

export async function sendInvoice(invoiceId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_billing')

  const { data: invoice } = await supabase
    .from('invoices')
    .select(
      '*, clients(contact_email, company_name), organizations(name)'
    )
    .eq('id', invoiceId)
    .eq('organization_id', orgId)
    .single()

  if (!invoice) return { error: 'Invoice not found.' }

  // Update status to sent
  await supabase
    .from('invoices')
    .update({
      status: 'sent',
      issued_date: invoice.issued_date || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .eq('organization_id', orgId)

  // Send email
  await sendInvoiceEmail({
    toEmail: invoice.clients.contact_email,
    clientName: invoice.clients.company_name,
    orgName: (invoice.organizations as unknown as { name: string })?.name ?? 'AdDesk',
    invoiceNumber: invoice.invoice_number,
    totalPesewas: invoice.total,
    dueDate: invoice.due_date,
    viewToken: invoice.view_token,
  })

  revalidatePath('/dashboard/billing')
  return { success: true }
}
