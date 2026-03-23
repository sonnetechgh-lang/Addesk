import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PlusCircle, MoreVertical, Package as PackageIcon, Clock, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"

// Accent colors cycling through Apple system palette
const accentPalette = [
  { bar: "bg-brand-success", icon: "text-brand-success", iconBg: "bg-brand-success/10" },
  { bar: "bg-brand-accent",  icon: "text-brand-accent",  iconBg: "bg-brand-accent/10" },
  { bar: "bg-success",       icon: "text-success",       iconBg: "bg-success/10" },
  { bar: "bg-warning",       icon: "text-warning",       iconBg: "bg-warning/10" },
]

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: packages, error } = await supabase
    .from('packages')
    .select('*')
    .eq('influencer_id', user?.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching packages:', error)
  }

  return (
    <div className="space-y-7 pb-12 animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Packages</h1>
          <p className="text-text-secondary mt-1 text-sm">Manage the services you offer to brands.</p>
        </div>
        <Button asChild variant="success" size="default" className="gap-2">
          <Link href="/dashboard/packages/new">
            <PlusCircle className="h-4 w-4" />
            New Package
          </Link>
        </Button>
      </div>

      {packages && packages.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, i) => {
            const accent = accentPalette[i % accentPalette.length]
            return (
              <div
                key={pkg.id}
                className="bg-surface-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col group card-hover relative overflow-hidden"
              >
                {/* Top accent bar */}
                <div className={`h-1 w-full ${accent.bar} shrink-0`} />

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-5">
                    <div className={`h-10 w-10 rounded-xl ${accent.iconBg} flex items-center justify-center`}>
                      <PackageIcon className={`h-5 w-5 ${accent.icon}`} />
                    </div>
                    <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-light text-text-muted transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-[16px] font-bold text-text-primary leading-snug group-hover:text-brand-success transition-colors duration-200">
                      {pkg.title}
                    </h3>
                    {pkg.description && (
                      <p className="mt-2 text-[13px] text-text-secondary line-clamp-2 leading-relaxed">
                        {pkg.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-1.5 text-[12px] text-text-muted font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      {pkg.delivery_days} day{pkg.delivery_days !== 1 ? 's' : ''} delivery
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">Price</span>
                      <div className="text-2xl font-bold text-text-primary tracking-tight">
                        GHS {(pkg.price / 100).toFixed(2)}
                      </div>
                    </div>

                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      pkg.is_active
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-border/60 text-text-muted border-transparent'
                    }`}>
                      {pkg.is_active ? (
                        <><CheckCircle2 className="h-3 w-3" /> Live</>
                      ) : (
                        <><Circle className="h-3 w-3 fill-current opacity-40" /> Draft</>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full-card clickable overlay */}
                <Link href={`/dashboard/packages/${pkg.id}`} className="absolute inset-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-success" />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface-card rounded-2xl border border-border shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-brand-success/10 flex items-center justify-center mb-5">
            <PlusCircle className="h-8 w-8 text-brand-success" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">No packages yet</h3>
          <p className="text-text-secondary mt-2 mb-8 text-[14px] max-w-sm">
            Create your first service package so brands can start booking you instantly.
          </p>
          <Link href="/dashboard/packages/new">
            <Button variant="success" size="default" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create your first package
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
