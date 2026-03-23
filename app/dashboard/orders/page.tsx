import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ShoppingBag, ChevronRight, Search } from "lucide-react"
import { Button } from '@/components/ui/button'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, packages(title)')
    .eq('influencer_id', user?.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'new':         return 'bg-brand-success/10 text-brand-success border-brand-success/20'
      case 'in_progress': return 'bg-warning/10 text-warning border-warning/20'
      case 'submitted':   return 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'
      case 'completed':   return 'bg-success/10 text-success border-success/20'
      case 'cancelled':   return 'bg-error/10 text-error border-error/20'
      default:            return 'bg-border/70 text-text-muted border-transparent'
    }
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'new':         return 'bg-brand-success'
      case 'in_progress': return 'bg-warning'
      case 'submitted':   return 'bg-brand-accent'
      case 'completed':   return 'bg-success'
      case 'cancelled':   return 'bg-error'
      default:            return 'bg-text-muted'
    }
  }

  return (
    <div className="space-y-7 pb-12 animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Orders</h1>
          <p className="text-text-secondary mt-1 text-sm">Manage your campaign bookings and deliverables.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 h-10 bg-surface-card border border-border rounded-xl text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-success/20 focus:border-brand-success transition-all"
          />
        </div>
      </div>

      {orders && orders.length > 0 ? (
        <div className="bg-surface-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-light/70">
                  <th className="px-6 py-3.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">Client</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">Package</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">Amount</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">Date</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-bold text-text-muted uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="group hover:bg-brand-success/[0.03] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-success/10 flex items-center justify-center text-brand-success font-bold text-xs shrink-0">
                          {order.client_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold text-text-primary leading-tight">{order.client_name}</div>
                          <div className="text-[11px] text-text-muted mt-0.5">{order.client_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px] text-text-secondary font-medium">
                        {(order as any).packages?.title || 'Custom Service'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[14px] font-bold text-text-primary">
                        GHS {(order.amount / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px] text-text-secondary">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`apple-badge border ${getStatusStyle(order.order_status)}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(order.order_status)}`} />
                        {order.order_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-surface-light text-text-muted hover:bg-brand-success hover:text-white border border-border hover:border-brand-success transition-all duration-150"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack */}
          <div className="md:hidden divide-y divide-border">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="block p-5 hover:bg-surface-light/60 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-brand-success/10 flex items-center justify-center text-brand-success font-bold text-sm shrink-0">
                      {order.client_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-text-primary">{order.client_name}</div>
                      <div className="text-[11px] text-text-muted">{(order as any).packages?.title || 'Custom Service'}</div>
                    </div>
                  </div>
                  <span className={`apple-badge border ${getStatusStyle(order.order_status)}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(order.order_status)}`} />
                    {order.order_status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-surface-light rounded-xl p-3">
                  <span className="text-[12px] text-text-secondary">
                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-[15px] font-bold text-text-primary">
                    GHS {(order.amount / 100).toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface-card rounded-2xl border border-border shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-brand-success/10 flex items-center justify-center mb-5">
            <ShoppingBag className="h-8 w-8 text-brand-success" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">No orders yet</h3>
          <p className="text-text-secondary mt-2 mb-8 text-[14px] max-w-sm">
            Share your booking link to start receiving paid orders from brands.
          </p>
          <Link href="/dashboard">
            <Button variant="success" size="default">Go to Overview</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
