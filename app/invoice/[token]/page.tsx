import { notFound } from 'next/navigation'
import { getInvoiceByToken } from '@/actions/invoices'
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from '@/types/billing'
import type { InvoiceStatus } from '@/types/billing'
import { PrintButton } from './print-button'

function formatGHS(pesewas: number) {
  return `GHS ${(pesewas / 100).toFixed(2)}`
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invoice = await getInvoiceByToken(token)

  if (!invoice) notFound()

  const lineItems = (invoice as unknown as { invoice_line_items: { id: string; description: string; quantity: number; unit_price: number; total_price: number }[] }).invoice_line_items ?? []
  const org = (invoice as unknown as { organizations: { name: string; logo_url: string | null } }).organizations
  const client = (invoice as unknown as { clients: { company_name: string; contact_name: string; billing_address: string | null } }).clients

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Print-ready invoice */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm print:border-none print:shadow-none">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">INVOICE</h1>
              <p className="mt-1 text-sm text-zinc-500">
                {invoice.invoice_number}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold print:border print:border-zinc-300 ${
                INVOICE_STATUS_COLORS[invoice.status as InvoiceStatus]
              }`}
            >
              {INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus]}
            </span>
          </div>

          {/* From/To */}
          <div className="mt-8 grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                From
              </p>
              <p className="mt-1 font-semibold text-zinc-900">
                {org?.name ?? 'AdDesk'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Bill To
              </p>
              <p className="mt-1 font-semibold text-zinc-900">
                {client?.company_name}
              </p>
              <p className="text-zinc-500">{client?.contact_name}</p>
              {client?.billing_address && (
                <p className="mt-1 whitespace-pre-line text-zinc-500">
                  {client.billing_address}
                </p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-zinc-400">Issued</p>
              <p className="text-zinc-700">
                {invoice.issued_date
                  ? new Date(invoice.issued_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Due Date</p>
              <p className="text-zinc-700">
                {invoice.due_date
                  ? new Date(invoice.due_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
            {(invoice as unknown as { campaigns?: { name: string } }).campaigns?.name && (
              <div>
                <p className="text-xs font-medium text-zinc-400">Campaign</p>
                <p className="text-zinc-700">
                  {(invoice as unknown as { campaigns: { name: string } }).campaigns.name}
                </p>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="mt-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs font-semibold text-zinc-400">
                  <th className="py-2 text-left">Description</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li) => (
                  <tr key={li.id} className="border-b border-zinc-50">
                    <td className="py-3 text-zinc-700">{li.description}</td>
                    <td className="py-3 text-right text-zinc-600">
                      {li.quantity}
                    </td>
                    <td className="py-3 text-right text-zinc-600">
                      {formatGHS(li.unit_price)}
                    </td>
                    <td className="py-3 text-right font-medium text-zinc-900">
                      {formatGHS(li.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Subtotal</span>
                <span className="text-zinc-700">
                  {formatGHS(invoice.subtotal)}
                </span>
              </div>
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Tax</span>
                  <span className="text-zinc-700">
                    {formatGHS(invoice.tax_amount)}
                  </span>
                </div>
              )}
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Discount</span>
                  <span className="text-emerald-600">
                    -{formatGHS(invoice.discount_amount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold">
                <span className="text-zinc-900">Total Due</span>
                <span className="text-zinc-900">
                  {formatGHS(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 border-t border-zinc-100 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 border-t border-zinc-100 pt-6 text-center text-xs text-zinc-400">
            <p>
              Generated by {org?.name ?? 'AdDesk'} via AdDesk
            </p>
          </div>
        </div>

        {/* Print button (hidden in print) */}
        <div className="mt-4 text-center print:hidden">
          <PrintButton />
        </div>
      </div>
    </div>
  )
}
