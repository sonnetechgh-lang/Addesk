import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Package, Wallet, Activity, Eye } from "lucide-react"
import { ShareLink } from '@/components/dashboard/ShareLink'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Fetch ALL orders to calculate lifetime stats correctly
  const { data: orders } = await supabase
    .from('orders')
    .select('*, packages(title)')
    .eq('influencer_id', user?.id)
    .order('created_at', { ascending: false })

  const totalOrders = orders?.length || 0
  const completedCount = orders?.filter(o => o.order_status === 'completed').length || 0
  const progressPercent = totalOrders > 0 ? Math.round((completedCount / totalOrders) * 100) : 0

  const stats = {
    totalRevenue: orders?.filter(o => o.payment_status === 'paid').reduce((acc, o) => acc + o.amount, 0) || 0,
    activeOrders: orders?.filter(o => o.order_status === 'new' || o.order_status === 'in_progress').length || 0,
    completedOrders: completedCount,
  }

  // Fetch profile view count
  const { count: profileViewCount } = await supabase
    .from('profile_views')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user?.id)

  // Get only the most recent 5 for the list view
  const recentOrders = orders?.slice(0, 5) || []

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-1">Dashboard</h1>
          <p className="text-text-secondary text-sm">
            Here&apos;s what&apos;s happening with your deals, <span className="font-semibold text-text-primary">@{profile?.username}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/book/${profile?.username}`} target="_blank">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-success text-white text-sm font-semibold hover:bg-brand-success-dark transition-colors shadow-elevation-low">
              <span className="text-lg leading-none">+</span> View Public Page
            </button>
          </Link>
          <Link href="/dashboard/settings">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-card border border-border text-text-primary text-sm font-semibold hover:bg-surface-light transition-colors shadow-elevation-low">
              Settings
            </button>
          </Link>
        </div>
      </div>

      {/* Stat Cards - Bento Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Main Revenue Card */}
        <div className="relative group overflow-hidden bg-brand-success rounded-3xl p-6 shadow-elevation-low hover:shadow-elevation-medium transition-shadow">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[14px] font-medium text-white/90">
              Total Earnings
            </span>
          </div>
          <div className="relative z-10 mt-2">
            <div className="text-4xl font-bold text-white tracking-tight mb-2">GHS {(stats.totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-white/70 font-medium inline-flex items-center gap-1.5 p-1 rounded-md bg-white/10">
              <Wallet className="h-3 w-3" /> Lifetime via Paystack
            </p>
          </div>
        </div>

        {/* Active Orders Card */}
        <div className="relative group bg-surface-card border border-border rounded-3xl p-6 shadow-elevation-low hover:shadow-elevation-medium transition-shadow">
          <div>
            <span className="text-[14px] font-medium text-text-primary">
              Active Orders
            </span>
          </div>
          <div className="mt-2">
            <div className="text-4xl font-bold text-text-primary tracking-tight mb-2">{stats.activeOrders}</div>
            <p className="text-[11px] text-text-muted font-medium inline-flex items-center gap-1.5 p-1 rounded-md bg-surface-light">
              <Activity className="h-3 w-3" /> Pending briefs
            </p>
          </div>
        </div>

        {/* Completed Orders Card */}
        <div className="relative group bg-surface-card border border-border rounded-3xl p-6 shadow-elevation-low hover:shadow-elevation-medium transition-shadow">
          <div>
            <span className="text-[14px] font-medium text-text-primary">
              Completed
            </span>
          </div>
          <div className="mt-2">
            <div className="text-4xl font-bold text-text-primary tracking-tight mb-2">{stats.completedOrders}</div>
            <p className="text-[11px] text-text-muted font-medium inline-flex items-center gap-1.5 p-1 rounded-md bg-surface-light">
              <Package className="h-3 w-3" /> Safely delivered
            </p>
          </div>
        </div>

        {/* Profile Views Card */}
        <div className="relative group bg-surface-card border border-border rounded-3xl p-6 shadow-elevation-low hover:shadow-elevation-medium transition-shadow">
          <div>
             <span className="text-[14px] font-medium text-text-primary">
               Profile Views
             </span>
          </div>
          <div className="mt-2">
            <div className="text-4xl font-bold text-text-primary tracking-tight mb-2">{profileViewCount ?? 0}</div>
            <p className="text-[11px] text-brand-success font-medium inline-flex items-center gap-1.5 p-1 rounded-md bg-brand-success/8 border border-brand-success/20">
              <Eye className="h-3 w-3" /> Unique visitors
            </p>
          </div>
        </div>
      </div>

      {/* Middle Grid: Placeholder Graph / Team Collab (Recent Orders) */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4 bg-surface-card border border-border rounded-3xl shadow-elevation-low p-6 flex flex-col items-center justify-center min-h-55">
           <div className="flex items-center gap-3 w-full justify-between mb-4">
               <h3 className="font-semibold text-text-primary">Project Progress</h3>
           </div>
           
           <div className="relative w-40 h-40 mt-4 mx-auto">
             <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(var(--brand-success) 0% ${progressPercent}%, var(--surface-light) ${progressPercent}% 100%)` }}></div>
             <div className="absolute inset-8 bg-surface-card rounded-full flex flex-col items-center justify-center">
               <span className="text-3xl font-bold text-text-primary">{progressPercent}%</span>
               <span className="text-xs text-text-muted">{completedCount}/{totalOrders} Done</span>
             </div>
           </div>
           
           <div className="flex gap-4 mt-6 text-xs text-text-muted font-medium w-full justify-center">
               <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-success"></span> Completed</span>
               <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-surface-light"></span> Pending</span>
           </div>
        </div>

        {/* Recent Orders - Styled like Team Collaboration */}
        <div className="lg:col-span-8 bg-surface-card border border-border rounded-3xl shadow-elevation-low p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-bold text-text-primary">
              Recent Orders
            </h2>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary hover:text-text-primary transition-colors border border-border px-3 py-1.5 rounded-full hover:bg-surface-light"
            >
              View all
            </Link>
          </div>

          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-surface-light flex items-center justify-center text-text-secondary font-bold text-sm shrink-0 border border-border">
                      {order.client_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-text-primary leading-tight group-hover:text-brand-success transition-colors">{order.client_name}</div>
                      <div className="text-[12px] text-text-muted mt-0.5"><span className="text-text-tertiary">Buying</span> {order.packages?.title || 'Service order'}</div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-md ${
                        order.order_status === 'completed' ? 'bg-status-completed-bg text-status-completed' :
                        order.order_status === 'new' ? 'bg-status-new-bg text-status-new' :
                        'bg-status-in-progress-bg text-status-in-progress'
                    }`}>
                      {order.order_status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-40 text-center">
               <p className="text-[14px] font-bold text-text-muted">No active orders yet</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Lower Grid: Share Your Link Card */}
      <div className="grid gap-4 lg:grid-cols-12 mt-4">
        {/* Share Your Link Card (Styled like Donezo Time Tracker) */}
        <div className="lg:col-span-4 bg-brand-success rounded-3xl shadow-elevation-low p-8 text-white relative overflow-hidden flex flex-col justify-between" style={{ backgroundImage: 'radial-gradient(circle at top left, var(--brand-success-light), var(--brand-success))' }}>
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`, backgroundSize: '10px 10px' }} />

          <div className="relative z-10 w-full text-center">
            <h2 className="text-sm font-medium mb-1 tracking-tight text-white/90">Public Link Status</h2>
            
            <div className="flex flex-col items-center mb-6 mt-4">
              <div className="relative">
                {profile?.profile_photo_url ? (
                  <Image src={profile.profile_photo_url} alt={profile.full_name || ''} width={64} height={64} className="w-16 h-16 rounded-full object-cover border-2 border-white/30 shadow-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-400 border-2 border-white shadow-sm" />
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-semibold text-white/90 tracking-wide">Online</span>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-1 border border-white/10 shadow-inner mt-4">
               <ShareLink username={profile?.username} />
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
