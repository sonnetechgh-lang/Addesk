import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClientsForSelect } from '@/actions/clients'
import { getCampaigns } from '@/actions/campaigns'
import { NewInvoiceForm } from './client'

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [clients, campaigns] = await Promise.all([
    getClientsForSelect(),
    getCampaigns(),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">New Invoice</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create a new invoice for a client.
        </p>
      </div>

      <NewInvoiceForm clients={clients} campaigns={campaigns} />
    </div>
  )
}
