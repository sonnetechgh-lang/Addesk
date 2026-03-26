import Link from 'next/link'
import { Instagram, Twitter, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DEMO_PROFILE, DEMO_PACKAGES } from '@/lib/demo-data'

export default function DemoBookingPage() {
  return (
    <div className="min-h-screen bg-surface-light font-sans text-text-primary selection:bg-brand-success/20">
      {/* Cover */}
      <div className="h-48 sm:h-64 w-full bg-brand-secondary relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-[-50%] left-[20%] w-[50%] h-[150%] rounded-full bg-brand-success blur-[100px] mix-blend-screen opacity-50" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[150%] rounded-full bg-brand-accent blur-[100px] mix-blend-screen opacity-50" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-20 relative z-10">
        {/* Profile Header */}
        <div className="bg-surface-card rounded-2xl border border-border p-8 text-center space-y-6 mb-12 shadow-[0_1px_3px_rgba(0,0,0,0.06)] relative">
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 h-28 w-28 rounded-2xl border-2 border-border overflow-hidden bg-surface-light flex items-center justify-center">
            <span className="text-text-muted text-5xl font-bold">
              {DEMO_PROFILE.full_name.charAt(0)}
            </span>
          </div>

          <div className="pt-12">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary tracking-tight">{DEMO_PROFILE.full_name}</h1>
            <p className="text-text-secondary mt-1 text-lg font-medium">@{DEMO_PROFILE.username}</p>
          </div>

          <p className="max-w-2xl mx-auto text-base text-text-secondary leading-relaxed">
            {DEMO_PROFILE.bio}
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {DEMO_PROFILE.instagram_handle && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-light border border-border text-sm font-medium text-text-secondary">
                <Instagram className="h-4 w-4" />
                {DEMO_PROFILE.instagram_handle}
              </div>
            )}
            {DEMO_PROFILE.tiktok_handle && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-light border border-border text-sm font-medium text-text-secondary">
                <span className="font-bold text-xs uppercase tracking-wider">TikTok:</span>
                {DEMO_PROFILE.tiktok_handle}
              </div>
            )}
            {DEMO_PROFILE.twitter_handle && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-light border border-border text-sm font-medium text-text-secondary">
                <Twitter className="h-4 w-4" />
                {DEMO_PROFILE.twitter_handle}
              </div>
            )}
          </div>
        </div>

        {/* Packages Grid */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-text-primary tracking-tight">Available <span className="text-brand-success">Packages</span></h2>

          <div className="grid gap-8 md:grid-cols-2">
            {DEMO_PACKAGES.map((pkg) => (
              <div key={pkg.id} className="flex flex-col h-full bg-surface-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)] hover:-translate-y-1 hover:border-brand-success/40 transition-all overflow-hidden group">
                <div className="p-8 pb-0">
                  <h3 className="text-2xl font-bold text-text-primary mb-1 tracking-tight">{pkg.title}</h3>
                  <div className="flex items-center gap-2 text-brand-success text-xs font-bold uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5" /> {pkg.delivery_days} Days Delivery
                  </div>
                </div>

                <div className="p-8 pt-6 flex-1">
                  <p className="text-text-secondary line-clamp-3 leading-relaxed text-sm">
                    {pkg.description}
                  </p>
                  <div className="mt-8 flex items-baseline gap-1">
                    <span className="text-sm font-bold text-text-muted">GHS</span>
                    <span className="text-4xl font-display font-bold text-text-primary">
                      {(pkg.price / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-8 pt-0">
                  <Button variant="success" className="w-full h-12 rounded-xl font-bold text-base shadow-[0_2px_12px_rgba(15,100,67,0.35)] cursor-default opacity-80" disabled>
                    Book Now
                  </Button>
                  <p className="text-[11px] text-text-muted mt-2 text-center">
                    <Link href="/signup" className="text-brand-success font-semibold hover:underline">Sign up</Link> to accept real bookings
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
