'use server'

import { createClient } from '@/lib/supabase/server'
import { getOrgContext, checkPermission } from '@/lib/rbac'

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

export async function getRevenueReport(
  period: 'monthly' | 'quarterly' = 'monthly'
) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_billing')

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('total, status, issued_date, paid_date, campaign_id, campaigns(name)')
    .eq('organization_id', orgId)
    .in('status', ['paid', 'partial', 'sent', 'viewed', 'overdue'])

  if (error) {
    console.error('Revenue report failed:', error.message)
    return { monthly: [], summary: { total: 0, paid: 0, outstanding: 0 } }
  }

  // Group by month
  const monthlyMap = new Map<string, { revenue: number; paid: number; outstanding: number; count: number }>()

  for (const inv of invoices ?? []) {
    const dateStr = inv.issued_date || inv.paid_date
    if (!dateStr) continue

    const d = new Date(dateStr)
    const key =
      period === 'quarterly'
        ? `${d.getFullYear()} Q${Math.ceil((d.getMonth() + 1) / 3)}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    const entry = monthlyMap.get(key) ?? { revenue: 0, paid: 0, outstanding: 0, count: 0 }
    entry.revenue += inv.total
    entry.count += 1

    if (inv.status === 'paid') {
      entry.paid += inv.total
    } else {
      entry.outstanding += inv.total
    }

    monthlyMap.set(key, entry)
  }

  const monthly = Array.from(monthlyMap.entries())
    .map(([period, data]) => ({ period, ...data }))
    .sort((a, b) => a.period.localeCompare(b.period))

  const summary = {
    total: monthly.reduce((s, m) => s + m.revenue, 0),
    paid: monthly.reduce((s, m) => s + m.paid, 0),
    outstanding: monthly.reduce((s, m) => s + m.outstanding, 0),
  }

  return { monthly, summary }
}

export async function getOutstandingInvoices() {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_billing')

  const { data, error } = await supabase
    .from('invoices')
    .select('*, clients(company_name, contact_name)')
    .eq('organization_id', orgId)
    .in('status', ['sent', 'viewed', 'overdue', 'partial'])
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Outstanding invoices failed:', error.message)
    return []
  }

  return data ?? []
}

export async function getRevenueByClient() {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_billing')

  const { data, error } = await supabase
    .from('invoices')
    .select('total, status, client_id, clients(company_name)')
    .eq('organization_id', orgId)
    .in('status', ['paid', 'partial'])

  if (error) {
    console.error('Revenue by client failed:', error.message)
    return []
  }

  const clientMap = new Map<string, { clientName: string; total: number; count: number }>()

  for (const inv of data ?? []) {
    if (!inv.client_id) continue
    const entry = clientMap.get(inv.client_id) ?? {
      clientName: (inv.clients as unknown as { company_name: string })?.company_name ?? 'Unknown',
      total: 0,
      count: 0,
    }
    entry.total += inv.total
    entry.count += 1
    clientMap.set(inv.client_id, entry)
  }

  return Array.from(clientMap.values()).sort((a, b) => b.total - a.total)
}
