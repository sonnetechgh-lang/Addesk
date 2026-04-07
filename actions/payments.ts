'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrgContext, checkPermission } from '@/lib/rbac'

const recordPaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.coerce.number().int().min(1, 'Amount must be positive'),
  payment_method: z.enum([
    'bank_transfer',
    'mobile_money',
    'cash',
    'cheque',
    'paystack',
    'other',
  ]),
  reference: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

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

export async function recordPayment(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_billing')

  const parsed = recordPaymentSchema.safeParse({
    invoice_id: formData.get('invoice_id'),
    amount: formData.get('amount'),
    payment_method: formData.get('payment_method'),
    reference: formData.get('reference') || '',
    notes: formData.get('notes') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Insert payment
  const { error } = await supabase.from('payments').insert({
    invoice_id: parsed.data.invoice_id,
    amount: parsed.data.amount,
    payment_method: parsed.data.payment_method,
    reference: parsed.data.reference || null,
    notes: parsed.data.notes || null,
    status: 'completed',
    recorded_by: user.id,
  })

  if (error) {
    console.error('Record payment failed:', error.message)
    return { error: { _form: ['Failed to record payment.'] } }
  }

  // Check total paid vs invoice total
  const { data: invoice } = await supabase
    .from('invoices')
    .select('total')
    .eq('id', parsed.data.invoice_id)
    .single()

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', parsed.data.invoice_id)
    .eq('status', 'completed')

  if (invoice && payments) {
    const totalPaid = payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
    const newStatus = totalPaid >= invoice.total ? 'paid' : 'partial'

    await supabase
      .from('invoices')
      .update({
        status: newStatus,
        paid_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.invoice_id)
      .eq('organization_id', orgId)
  }

  revalidatePath('/dashboard/billing')
  return { success: true }
}

export async function deletePayment(paymentId: string, invoiceId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_billing')

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId)

  if (error) {
    console.error('Delete payment failed:', error.message)
    return { error: 'Failed to delete payment.' }
  }

  // Recalculate invoice status
  const { data: invoice } = await supabase
    .from('invoices')
    .select('total, status')
    .eq('id', invoiceId)
    .single()

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoiceId)
    .eq('status', 'completed')

  if (invoice && payments) {
    const totalPaid = payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
    let newStatus = invoice.status
    if (totalPaid <= 0) newStatus = 'sent'
    else if (totalPaid >= invoice.total) newStatus = 'paid'
    else newStatus = 'partial'

    await supabase
      .from('invoices')
      .update({
        status: newStatus,
        paid_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('organization_id', orgId)
  }

  revalidatePath('/dashboard/billing')
  return { success: true }
}

export async function getPaymentsForInvoice(invoiceId: string) {
  const { supabase } = await getAuthOrgContext()

  const { data, error } = await supabase
    .from('payments')
    .select('*, profiles(full_name)')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get payments failed:', error.message)
    return []
  }

  return data ?? []
}
