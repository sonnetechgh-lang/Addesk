import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllTasks } from '@/actions/production'
import { ProductionBoard } from '@/components/dashboard/ProductionBoard'

export default async function ProductionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tasks = await getAllTasks()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Production Board</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Track all production tasks across briefs.
        </p>
      </div>

      <ProductionBoard tasks={tasks} />
    </div>
  )
}
