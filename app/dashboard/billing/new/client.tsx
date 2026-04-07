'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createInvoice } from '@/actions/invoices'

type Props = {
  clients: { id: string; company_name: string; contact_name: string }[]
  campaigns: { id: string; name: string }[]
}

export function NewInvoiceForm({ clients, campaigns }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createInvoice(formData)
      if (result?.error && typeof result.error === 'object') {
        setErrors(result.error as Record<string, string[]>)
      } else if (result?.success && result.invoiceId) {
        router.push(`/dashboard/billing/${result.invoiceId}`)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5">
          {/* Client */}
          <div>
            <label
              htmlFor="client_id"
              className="mb-1.5 block text-sm font-semibold text-zinc-700"
            >
              Client *
            </label>
            <select
              id="client_id"
              name="client_id"
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} — {c.contact_name}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="mt-1 text-xs text-red-500">{errors.client_id[0]}</p>
            )}
          </div>

          {/* Campaign (optional) */}
          <div>
            <label
              htmlFor="campaign_id"
              className="mb-1.5 block text-sm font-semibold text-zinc-700"
            >
              Campaign (optional)
            </label>
            <select
              id="campaign_id"
              name="campaign_id"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">None</option>
              {campaigns.map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label
              htmlFor="due_date"
              className="mb-1.5 block text-sm font-semibold text-zinc-700"
            >
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Tax & Discount in pesewas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tax_amount"
                className="mb-1.5 block text-sm font-semibold text-zinc-700"
              >
                Tax (pesewas)
              </label>
              <input
                type="number"
                id="tax_amount"
                name="tax_amount"
                min={0}
                defaultValue={0}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label
                htmlFor="discount_amount"
                className="mb-1.5 block text-sm font-semibold text-zinc-700"
              >
                Discount (pesewas)
              </label>
              <input
                type="number"
                id="discount_amount"
                name="discount_amount"
                min={0}
                defaultValue={0}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="mb-1.5 block text-sm font-semibold text-zinc-700"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Payment terms, bank details, etc."
            />
          </div>
        </div>
      </div>

      {errors._form && (
        <p className="text-sm text-red-500">{errors._form[0]}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? 'Creating...' : 'Create Invoice'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/billing')}
          className="rounded-xl border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
