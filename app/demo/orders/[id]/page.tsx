import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  MessageSquare,
  Package,
  MapPin,
  Truck,
  Play,
} from "lucide-react"
import { DEMO_ORDERS } from '@/lib/demo-data'

export default async function DemoOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = DEMO_ORDERS.find(o => o.id === id)

  if (!order) {
    return notFound()
  }

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    new: { label: 'New Order', color: 'text-status-new', bg: 'bg-status-new-bg', dot: 'bg-status-new' },
    in_progress: { label: 'In Progress', color: 'text-status-in-progress', bg: 'bg-status-in-progress-bg', dot: 'bg-status-in-progress' },
    completed: { label: 'Completed', color: 'text-status-completed', bg: 'bg-status-completed-bg', dot: 'bg-status-completed' },
  }

  const statusConfig = STATUS_CONFIG[order.order_status] || STATUS_CONFIG.new

  return (
    <div className="space-y-7 pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <Link
          href="/demo/orders"
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-card border border-border text-text-muted hover:text-brand-success hover:border-brand-success/30 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Order Details</h1>
            <span className="text-[11px] font-mono text-text-muted bg-surface-light px-2 py-0.5 rounded-md border border-border">
              #{order.reference.slice(0, 8)}
            </span>
          </div>
          <p className="text-text-secondary text-[13px] mt-0.5">
            Placed on {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-5">
          {/* Client Info */}
          <section className="bg-surface-card rounded-2xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-7 w-7 rounded-lg bg-brand-success/10 flex items-center justify-center text-brand-success">
                <User className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Client Information</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Name</label>
                <p className="text-[15px] text-text-primary font-semibold">{order.client_name}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Email</label>
                <span className="text-brand-success font-medium text-[14px]">
                  {order.client_email}
                </span>
              </div>
            </div>
          </section>

          {/* Campaign Brief */}
          <section className="bg-surface-card rounded-2xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-7 w-7 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Campaign Brief</h3>
            </div>
            <div className="space-y-5">
              <div>
                <h4 className="text-[12px] font-bold text-text-muted uppercase tracking-wider mb-2">Package Selected</h4>
                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-surface-light rounded-xl border border-border">
                  <span className="text-text-primary font-semibold text-[14px]">{order.packages?.title || 'Custom Service'}</span>
                  <span className="text-border">•</span>
                  <span className="text-brand-success font-bold text-[14px]">GHS {(order.amount / 100).toFixed(2)}</span>
                </div>
              </div>
              <div>
                <h4 className="text-[12px] font-bold text-text-muted uppercase tracking-wider mb-2">Instructions & Requirements</h4>
                <div className="bg-surface-light rounded-xl p-5 text-text-secondary text-[14px] leading-relaxed whitespace-pre-wrap border border-border/50">
                  {order.product_description}
                </div>
              </div>
            </div>
          </section>

          {/* Delivery Information */}
          {order.delivery_type && order.delivery_type !== 'digital' && (
            <section className="bg-surface-card rounded-2xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-7 w-7 rounded-lg bg-brand-success/10 flex items-center justify-center text-brand-success">
                  {order.delivery_type === 'physical' ? <Package className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                </div>
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  {order.delivery_type === 'physical' ? 'Shipping Details' : 'On-Premise Details'}
                </h3>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Physical Delivery
                </span>
              </div>

              {order.delivery_type === 'physical' && order.delivery_address && (
                <div className="space-y-2 text-[14px]">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                    <div>
                      <p className="text-text-primary font-medium">{order.delivery_address.street}</p>
                      <p className="text-text-secondary">{order.delivery_address.city}, {order.delivery_address.region}</p>
                      <p className="text-text-secondary">{order.delivery_address.country}</p>
                    </div>
                  </div>
                  {order.delivery_address.notes && (
                    <div className="mt-3 p-3 bg-surface-light rounded-lg border border-border/50 text-[13px] text-text-secondary">
                      <span className="font-semibold text-text-muted">Note:</span> {order.delivery_address.notes}
                    </div>
                  )}
                  {order.shipment_status && order.shipment_status !== 'not_applicable' && (
                    <div className="mt-4 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-text-muted" />
                      <span className="text-[12px] font-bold uppercase tracking-wider">Shipment: </span>
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        order.shipment_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        order.shipment_status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.shipment_status === 'delivered' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {order.shipment_status}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Shared Assets */}
          <section className="bg-surface-card rounded-2xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center text-success">
                <AlertCircle className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Shared Assets</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-xl bg-surface-light/50">
              <AlertCircle className="h-6 w-6 text-text-muted opacity-25 mb-2" />
              <p className="text-text-muted text-[13px] font-medium">No files attached to this order.</p>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-5">
          {/* Order Status (static for demo) */}
          <section className="bg-surface-card rounded-2xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-5">Order Status</h3>

            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl ${statusConfig.bg} mb-5`}>
              <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
              <span className={`text-[14px] font-bold ${statusConfig.color}`}>{statusConfig.label}</span>
            </div>

            {order.order_status !== 'completed' && (
              <button
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-bold bg-brand-success text-white shadow-elevation-medium cursor-default opacity-80"
                disabled
              >
                {order.order_status === 'new' ? <Play className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                {order.order_status === 'new' ? 'Start Working' : 'Mark as Completed'}
              </button>
            )}

            {order.order_status === 'completed' && (
              <div className="flex items-center gap-2 text-[13px] text-success font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                This order has been completed
              </div>
            )}

            <p className="text-[11px] text-text-muted mt-3 text-center">Demo mode — status changes disabled</p>
          </section>

          {/* Payment Overview */}
          <section className="bg-surface-card rounded-2xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-5">Payment Overview</h3>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-text-secondary">Order Total</span>
                <span className="text-text-primary font-bold">GHS {(order.amount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-text-secondary">Platform Fee (6%)</span>
                <span className="text-text-muted font-medium">- GHS {(order.platform_fee / 100).toFixed(2)}</span>
              </div>
              <div className="pt-3.5 border-t border-border flex justify-between items-center">
                <span className="text-text-primary font-bold text-[14px]">Your Earnings</span>
                <span className="text-xl font-bold text-brand-success">GHS {(order.influencer_amount / 100).toFixed(2)}</span>
              </div>
              <div className="mt-4 p-3.5 rounded-xl bg-success/8 border border-success/15 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-success">Payment Verified</div>
                  <div className="text-[10px] text-success/70 mt-0.5 leading-relaxed">Funds are secured by Paystack and will be settled automatically.</div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Card */}
          <section className="bg-brand-secondary rounded-2xl p-6 text-white relative overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
            <div className="absolute top-0 right-0 p-5 opacity-5">
              <MessageSquare className="h-16 w-16" />
            </div>
            <div className="relative z-10">
              <h3 className="text-[16px] font-bold mb-1.5">Need to talk?</h3>
              <p className="text-white/55 text-[13px] mb-5 leading-relaxed">
                Contact the client directly via their email.
              </p>
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand-success">
                Send Message <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
