import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getClients } from '@/actions/clients'
import { CREDIT_TERM_LABELS } from '@/types/campaigns'
import type { CreditTerm } from '@/types/campaigns'

type ClientRow = {
  id: string
  company_name: string
  contact_name: string
  contact_email: string
  credit_terms: string
  campaigns: { count: number }[]
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const clients = await getClients()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Clients</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your advertiser and agency contacts.
          </p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Link>
      </div>

      {/* Client List */}
      {clients.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
            <Users className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">No clients yet</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Add your first client to start creating campaigns.
          </p>
          <Link
            href="/dashboard/clients/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider">
                    Terms
                  </th>
                  <th className="px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider text-right">
                    Campaigns
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {(clients as ClientRow[]).map((client) => {
                  const campaignCount = client.campaigns?.[0]?.count ?? 0
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="font-medium text-zinc-900 hover:text-emerald-700 transition-colors"
                        >
                          {client.company_name}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-zinc-700">{client.contact_name}</p>
                        <p className="text-xs text-zinc-400">{client.contact_email}</p>
                      </td>
                      <td className="px-5 py-3 text-zinc-500">
                        {CREDIT_TERM_LABELS[client.credit_terms as CreditTerm] ?? client.credit_terms}
                      </td>
                      <td className="px-5 py-3 text-right text-zinc-500">
                        {campaignCount}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
