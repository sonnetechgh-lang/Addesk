import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReportsDashboard } from './client'
import { getRevenueReport, getOutstandingInvoices, getRevenueByClient } from '@/actions/reports'

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [revenueReport, outstanding, byClient] = await Promise.all([
    getRevenueReport(),
    getOutstandingInvoices(),
    getRevenueByClient(),
  ])

  return (
    <ReportsDashboard
      revenueReport={revenueReport}
      outstanding={outstanding}
      byClient={byClient}
    />
  )
}
