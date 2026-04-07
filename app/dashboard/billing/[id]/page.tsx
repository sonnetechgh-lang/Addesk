import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInvoiceById } from '@/actions/invoices'
import { InvoiceDetail } from './client'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const invoice = await getInvoiceById(id)
  if (!invoice) notFound()

  return <InvoiceDetail invoice={invoice} />
}
