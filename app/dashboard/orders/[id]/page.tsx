import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  User,
  MessageSquare,
  Package,
  MapPin,
  Calendar,
  Truck,
  Phone,
  Instagram
} from "lucide-react"
import OrderStatusControl from '@/components/dashboard/OrderStatusControl'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, packages(*)')
    .eq('id', id)
    .eq('influencer_id', user?.id)
    .single()

  if (error || !order) {
    return notFound()
  }

  return (
    <div className="space-y-7 pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <Link
          href="/dashboard/orders"
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
                <a href={`mailto:${order.client_email}`} className="text-brand-success font-medium text-[14px] hover:text-brand-success/80 transition-colors">
                  {order.client_email}
                </a>
              </div>
              {(order as any).client_phone && (
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Phone</label>
                  <a href={`tel:${(order as any).client_phone}`} className="text-text-primary font-medium text-[14px] flex items-center gap-1.5 hover:text-brand-success transition-colors">
                    <Phone className="h-3.5 w-3.5 text-text-muted" />
                    {(order as any).client_phone}
                  </a>
                </div>
              )}
            </div>
            {/* Client Social Handles */}
            {((order as any).client_instagram || (order as any).client_tiktok || (order as any).client_twitter) && (
              <div className="mt-5 pt-5 border-t border-border">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3 block">Social Media</label>
                <div className="flex flex-wrap gap-2">
                  {(order as any).client_instagram && (
                    <a href={`https://instagram.com/${(order as any).client_instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-light border border-border text-[13px] font-medium text-text-secondary hover:text-brand-success hover:border-brand-success/30 transition-colors">
                      <Instagram className="h-3.5 w-3.5" />
                      {(order as any).client_instagram}
                    </a>
                  )}
                  {(order as any).client_tiktok && (
                    <a href={`https://tiktok.com/@${(order as any).client_tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-light border border-border text-[13px] font-medium text-text-secondary hover:text-brand-success hover:border-brand-success/30 transition-colors">
                      <span className="text-[10px] font-bold">TT</span>
                      {(order as any).client_tiktok}
                    </a>
                  )}
                  {(order as any).client_twitter && (
                    <a href={`https://x.com/${(order as any).client_twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-light border border-border text-[13px] font-medium text-text-secondary hover:text-brand-success hover:border-brand-success/30 transition-colors">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      {(order as any).client_twitter}
                    </a>
                  )}
                </div>
              </div>
            )}
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
                  <span className="text-text-primary font-semibold text-[14px]">{(order as any).packages?.title || 'Custom Service'}</span>
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

          {/* Delivery Information (only for physical / on_premise) */}
          {(order as any).delivery_type && (order as any).delivery_type !== 'digital' && (
            <section className="bg-surface-card rounded-2xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-7 w-7 rounded-lg bg-brand-success/10 flex items-center justify-center text-brand-success">
                  {(order as any).delivery_type === 'physical' ? <Package className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                </div>
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  {(order as any).delivery_type === 'physical' ? 'Shipping Details' : 'On‑Premise Details'}
                </h3>
                <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  (order as any).delivery_type === 'physical'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-violet-100 text-violet-700'
                }`}>
                  {(order as any).delivery_type === 'physical' ? 'Physical Delivery' : 'On‑Premise'}
                </span>
              </div>

              {/* Physical Delivery Address */}
              {(order as any).delivery_type === 'physical' && (order as any).delivery_address && (
                <div className="space-y-2 text-[14px]">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                    <div>
                      <p className="text-text-primary font-medium">{(order as any).delivery_address.street}</p>
                      <p className="text-text-secondary">{(order as any).delivery_address.city}, {(order as any).delivery_address.region}</p>
                      {(order as any).delivery_address.zip && <p className="text-text-muted">{(order as any).delivery_address.zip}</p>}
                      <p className="text-text-secondary">{(order as any).delivery_address.country}</p>
                    </div>
                  </div>
                  {(order as any).delivery_address.notes && (
                    <div className="mt-3 p-3 bg-surface-light rounded-lg border border-border/50 text-[13px] text-text-secondary">
                      <span className="font-semibold text-text-muted">Note:</span> {(order as any).delivery_address.notes}
                    </div>
                  )}
                  {(order as any).shipment_status && (order as any).shipment_status !== 'not_applicable' && (
                    <div className="mt-4 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-text-muted" />
                      <span className="text-[12px] font-bold uppercase tracking-wider">
                        Shipment: 
                      </span>
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        (order as any).shipment_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        (order as any).shipment_status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        (order as any).shipment_status === 'delivered' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {(order as any).shipment_status}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* On-Premise Details */}
              {(order as any).delivery_type === 'on_premise' && (
                <div className="space-y-3 text-[14px]">
                  {(order as any).on_premise_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-text-muted shrink-0" />
                      <span className="text-text-primary font-medium">
                        {new Date((order as any).on_premise_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {' at '}
                        {new Date((order as any).on_premise_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  {(order as any).on_premise_location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                      <span className="text-text-primary font-medium">{(order as any).on_premise_location}</span>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Shared Assets */}
          <section className="bg-surface-card rounded-2xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center text-success">
                  <Download className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Shared Assets</h3>
              </div>
              {(order as any).brief_image_urls?.length > 0 && (
                <span className="text-[11px] text-text-muted">{(order as any).brief_image_urls.length} file{(order as any).brief_image_urls.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {(order as any).brief_image_urls?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(order as any).brief_image_urls.map((url: string, idx: number) => (
                  <a
                    key={idx}
                    href={url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square rounded-xl overflow-hidden border border-border hover:border-brand-success/40 transition-all shadow-sm"
                  >
                    <img
                      src={url}
                      alt={`Asset ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-xl bg-surface-light/50">
                <AlertCircle className="h-6 w-6 text-text-muted opacity-25 mb-2" />
                <p className="text-text-muted text-[13px] font-medium">No files attached to this order.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-5">
          {/* Order Status Control */}
          <OrderStatusControl orderId={order.id} currentStatus={order.order_status} />

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
              <a
                href={`mailto:${order.client_email}`}
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand-success hover:text-brand-success/80 transition-colors"
              >
                Send Message <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
