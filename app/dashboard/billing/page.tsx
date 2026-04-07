import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getInvoices } from '@/actions/invoices'
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from '@/types/billing'
import type { InvoiceStatus } from '@/types/billing'
import { Receipt, Plus } from 'lucide-react'

function formatGHS(pesewas: number) {
  return `GHS ${(pesewas / 100).toFixed(2)}`
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const invoices = await getInvoices(status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Billing</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create invoices, track payments, and manage billing.
          </p>
        </div>
        <Link
          href="/dashboard/billing/new"
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1">
        {['all', ...INVOICE_STATUSES].map((s) => {
          const isActive = (status ?? 'all') === s
          return (
            <Link
              key={s}
              href={
                s === 'all'
                  ? '/dashboard/billing'
                  : `/dashboard/billing?status=${s}`
              }
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {s === 'all' ? 'All' : INVOICE_STATUS_LABELS[s as InvoiceStatus]}
            </Link>
          )
        })}
      </div>

      {/* Invoice List */}
      {invoices.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
            <Receipt className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">
            {status && status !== 'all'
              ? 'No invoices with this status'
              : 'No invoices yet'}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Create your first invoice to start tracking billing.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-4 py-3 text-left font-semibold text-zinc-500">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-500">
                  Client
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-500">
                  Total
                </th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-500">
                  Paid
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-500">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-zinc-50 transition-colors hover:bg-zinc-50/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/billing/${inv.id}`}
                      className="font-semibold text-zinc-900 hover:text-emerald-600"
                    >
                      {inv.invoice_number}
                    </Link>
                    {inv.campaigns?.name && (
                      <p className="text-xs text-zinc-400">
                        {inv.campaigns.name}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {inv.clients?.company_name ?? 'Unknown'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        INVOICE_STATUS_COLORS[inv.status as InvoiceStatus]
                      }`}
                    >
                      {INVOICE_STATUS_LABELS[inv.status as InvoiceStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900">
                    {formatGHS(inv.total)}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-500">
                    {formatGHS(inv._paid_total ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {inv.due_date
                      ? new Date(inv.due_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
