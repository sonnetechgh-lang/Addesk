'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Copy,
  Send,
  Trash2,
  Plus,
  CreditCard,
  Printer,
} from 'lucide-react'
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
} from '@/types/billing'
import type { InvoiceStatus, PaymentMethod } from '@/types/billing'
import {
  sendInvoice,
  deleteInvoice,
  addInvoiceLineItem,
  deleteInvoiceLineItem,
  updateInvoice,
} from '@/actions/invoices'
import { recordPayment, deletePayment } from '@/actions/payments'

function formatGHS(pesewas: number) {
  return `GHS ${(pesewas / 100).toFixed(2)}`
}

type InvoiceData = {
  id: string
  invoice_number: string
  status: string
  view_token: string
  subtotal: number
  tax_amount: number
  total: number
  issued_date: string | null
  due_date: string | null
  paid_date: string | null
  notes: string | null
  clients?: { company_name: string; contact_name: string }
  campaigns?: { name: string }
  invoice_line_items: { id: string; description: string; quantity: number; unit_price: number; total_price: number }[]
  payments: { id: string; amount: number; payment_method: string; reference: string | null; status: string; payment_date: string; created_at: string; notes: string | null; profiles?: { full_name: string } | null }[]
}

export function InvoiceDetail({ invoice }: { invoice: InvoiceData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAddLine, setShowAddLine] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  const lineItems = invoice.invoice_line_items ?? []
  const payments = invoice.payments ?? []
  const paidTotal = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum: number, p) => sum + p.amount, 0)
  const balanceDue = Math.max(invoice.total - paidTotal, 0)

  const appUrl =
    typeof window !== 'undefined' ? window.location.origin : ''
  const publicUrl = `${appUrl}/invoice/${invoice.view_token}`

  function handleSend() {
    startTransition(async () => {
      await sendInvoice(invoice.id)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm('Delete this invoice permanently?')) return
    startTransition(async () => {
      await deleteInvoice(invoice.id)
      router.push('/dashboard/billing')
    })
  }

  function handleAddLineItem(formData: FormData) {
    formData.set('invoice_id', invoice.id)
    startTransition(async () => {
      await addInvoiceLineItem(formData)
      setShowAddLine(false)
      router.refresh()
    })
  }

  function handleDeleteLineItem(lineItemId: string) {
    startTransition(async () => {
      await deleteInvoiceLineItem(lineItemId, invoice.id)
      router.refresh()
    })
  }

  function handleRecordPayment(formData: FormData) {
    formData.set('invoice_id', invoice.id)
    startTransition(async () => {
      await recordPayment(formData)
      setShowPayment(false)
      router.refresh()
    })
  }

  function handleDeletePayment(paymentId: string) {
    startTransition(async () => {
      await deletePayment(paymentId, invoice.id)
      router.refresh()
    })
  }

  function handleMarkVoid() {
    const fd = new FormData()
    fd.set('id', invoice.id)
    fd.set('status', 'void')
    startTransition(async () => {
      await updateInvoice(fd)
      router.refresh()
    })
  }

  function copyLink() {
    navigator.clipboard.writeText(publicUrl)
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/billing"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 transition-colors hover:bg-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              {invoice.invoice_number}
            </h1>
            <p className="text-sm text-zinc-500">
              {invoice.clients?.company_name ?? 'Unknown client'}
              {invoice.campaigns?.name && ` · ${invoice.campaigns.name}`}
            </p>
          </div>
          <span
            className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              INVOICE_STATUS_COLORS[invoice.status as InvoiceStatus]
            }`}
          >
            {INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus]}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <Copy className="h-3.5 w-3.5" /> Copy Link
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          {invoice.status === 'draft' && (
            <button
              onClick={handleSend}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> Send Invoice
            </button>
          )}
          {['draft', 'sent', 'viewed'].includes(invoice.status) && (
            <button
              onClick={handleMarkVoid}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50"
            >
              Void
            </button>
          )}
          {invoice.status === 'draft' && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Subtotal', value: formatGHS(invoice.subtotal) },
          { label: 'Tax', value: formatGHS(invoice.tax_amount) },
          { label: 'Total', value: formatGHS(invoice.total) },
          {
            label: 'Balance Due',
            value: formatGHS(balanceDue),
            highlight: balanceDue > 0,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-zinc-400">{card.label}</p>
            <p
              className={`mt-1 text-lg font-bold ${
                card.highlight ? 'text-amber-600' : 'text-zinc-900'
              }`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Details Row */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="font-medium text-zinc-400">Issued</p>
            <p className="text-zinc-900">
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
            <p className="font-medium text-zinc-400">Due Date</p>
            <p className="text-zinc-900">
              {invoice.due_date
                ? new Date(invoice.due_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
          <div>
            <p className="font-medium text-zinc-400">Paid Date</p>
            <p className="text-zinc-900">
              {invoice.paid_date
                ? new Date(invoice.paid_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>
        {invoice.notes && (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <p className="text-xs font-medium text-zinc-400">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
              {invoice.notes}
            </p>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-bold text-zinc-900">Line Items</h2>
          {invoice.status === 'draft' && (
            <button
              onClick={() => setShowAddLine((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add Item
            </button>
          )}
        </div>

        {lineItems.length === 0 && !showAddLine ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            No line items. Add items to this invoice.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-50 text-xs text-zinc-400">
                <th className="px-6 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Unit Price</th>
                <th className="px-4 py-2 text-right">Total</th>
                {invoice.status === 'draft' && (
                  <th className="px-4 py-2 text-right" />
                )}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li) => (
                <tr key={li.id} className="border-b border-zinc-50">
                  <td className="px-6 py-3 text-zinc-700">{li.description}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">
                    {li.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-600">
                    {formatGHS(li.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900">
                    {formatGHS(li.total_price)}
                  </td>
                  {invoice.status === 'draft' && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteLineItem(li.id)}
                        disabled={isPending}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Add Line Item Form */}
        {showAddLine && (
          <form
            action={handleAddLineItem}
            className="border-t border-zinc-100 px-6 py-4"
          >
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6">
                <input
                  name="description"
                  required
                  placeholder="Description"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-2">
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-3">
                <input
                  name="unit_price"
                  type="number"
                  min={0}
                  required
                  placeholder="Price (pesewas)"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-1 flex items-center">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Payments */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-bold text-zinc-900">Payments</h2>
          {!['draft', 'paid', 'void', 'cancelled'].includes(
            invoice.status
          ) && (
            <button
              onClick={() => setShowPayment((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              <CreditCard className="h-3.5 w-3.5" /> Record Payment
            </button>
          )}
        </div>

        {payments.length === 0 && !showPayment ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            No payments recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {formatGHS(p.amount)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {PAYMENT_METHOD_LABELS[p.payment_method as PaymentMethod] ??
                      p.payment_method}
                    {p.reference && ` · ${p.reference}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400">
                    {new Date(p.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <button
                    onClick={() => handleDeletePayment(p.id)}
                    disabled={isPending}
                    className="text-zinc-300 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Record Payment Form */}
        {showPayment && (
          <form
            action={handleRecordPayment}
            className="border-t border-zinc-100 px-6 py-4"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <input
                  name="amount"
                  type="number"
                  min={1}
                  required
                  placeholder="Amount (pesewas)"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <select
                  name="payment_method"
                  required
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  name="reference"
                  placeholder="Reference (optional)"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Record Payment'}
              </button>
              <button
                type="button"
                onClick={() => setShowPayment(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
