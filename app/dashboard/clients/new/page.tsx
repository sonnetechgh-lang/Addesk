'use client'

import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClientAction } from '@/actions/clients'
import { CREDIT_TERMS, CREDIT_TERM_LABELS } from '@/types/campaigns'

const initialState = { error: null as Record<string, string[]> | null }

export default function NewClientPage() {
  const router = useRouter()

  async function handleSubmit(
    _prev: typeof initialState,
    formData: FormData
  ) {
    const result = await createClientAction(formData)
    if ('error' in result && result.error) {
      return { error: result.error as Record<string, string[]> }
    }
    router.push('/dashboard/clients')
    return { error: null }
  }

  const [state, action, isPending] = useActionState(handleSubmit, initialState)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Clients
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Add Client</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Add a new advertiser or agency to your CRM.
        </p>
      </div>

      <form action={action} className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Contact Details
          </h2>

          {/* Company Name */}
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-zinc-700 mb-1">
              Company Name *
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              placeholder="Acme Advertising Ltd."
            />
            {state.error?.company_name && (
              <p className="mt-1 text-xs text-red-600">{state.error.company_name[0]}</p>
            )}
          </div>

          {/* Contact Name */}
          <div>
            <label htmlFor="contact_name" className="block text-sm font-medium text-zinc-700 mb-1">
              Contact Name *
            </label>
            <input
              id="contact_name"
              name="contact_name"
              type="text"
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              placeholder="John Doe"
            />
            {state.error?.contact_name && (
              <p className="mt-1 text-xs text-red-600">{state.error.contact_name[0]}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Email */}
            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-zinc-700 mb-1">
                Email *
              </label>
              <input
                id="contact_email"
                name="contact_email"
                type="email"
                required
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                placeholder="john@acme.com"
              />
              {state.error?.contact_email && (
                <p className="mt-1 text-xs text-red-600">{state.error.contact_email[0]}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-zinc-700 mb-1">
                Phone
              </label>
              <input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                placeholder="+233 XX XXX XXXX"
              />
            </div>
          </div>

          {/* Credit Terms */}
          <div>
            <label htmlFor="credit_terms" className="block text-sm font-medium text-zinc-700 mb-1">
              Credit Terms
            </label>
            <select
              id="credit_terms"
              name="credit_terms"
              defaultValue="prepaid"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
            >
              {CREDIT_TERMS.map((term) => (
                <option key={term} value={term}>
                  {CREDIT_TERM_LABELS[term]}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors resize-none"
              placeholder="Internal notes about this client..."
            />
          </div>
        </div>

        {/* Billing Address */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Billing Address (optional)
          </h2>

          <div>
            <label htmlFor="billing_line1" className="block text-sm font-medium text-zinc-700 mb-1">
              Address Line
            </label>
            <input
              id="billing_line1"
              name="billing_line1"
              type="text"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              placeholder="123 Independence Ave"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="billing_city" className="block text-sm font-medium text-zinc-700 mb-1">
                City
              </label>
              <input
                id="billing_city"
                name="billing_city"
                type="text"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                placeholder="Accra"
              />
            </div>
            <div>
              <label htmlFor="billing_region" className="block text-sm font-medium text-zinc-700 mb-1">
                Region
              </label>
              <input
                id="billing_region"
                name="billing_region"
                type="text"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                placeholder="Greater Accra"
              />
            </div>
            <div>
              <label htmlFor="billing_country" className="block text-sm font-medium text-zinc-700 mb-1">
                Country
              </label>
              <input
                id="billing_country"
                name="billing_country"
                type="text"
                defaultValue="Ghana"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Form Error */}
        {state.error?._form && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error._form[0]}
          </p>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Saving...' : 'Add Client'}
          </button>
        </div>
      </form>
    </div>
  )
}
