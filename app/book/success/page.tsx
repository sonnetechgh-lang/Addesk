import Link from 'next/link'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ creator?: string }>
}) {
  const { creator } = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-surface-light font-sans text-text-primary">
      <div className="w-full max-w-lg space-y-8 text-center bg-surface-card p-8 sm:p-12 rounded-2xl border border-border shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        
        <div className="relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-success/20 rounded-full blur-2xl" />
          <div className="flex justify-center relative z-10">
            <CheckCircle2 className="h-20 w-20 text-success bg-surface-card rounded-full" strokeWidth={1.5} />
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Booking Confirmed!
          </h1>
          <p className="text-text-secondary mt-3 text-[15px] leading-relaxed">
            Your payment was successful. We&apos;ve notified the creator to start working on your brief.
          </p>
        </div>

        <div className="bg-surface-light rounded-xl p-5 text-[14px] text-left border border-border">
          <p className="font-bold text-text-primary mb-3">What happens next?</p>
          <ul className="text-text-secondary space-y-3">
            <li className="flex gap-3">
              <div className="h-5 w-5 rounded-md bg-brand-success/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-brand-success font-bold text-[10px]">1</span>
              </div>
              <span>The creator will review your brief requirements.</span>
            </li>
            <li className="flex gap-3">
              <div className="h-5 w-5 rounded-md bg-brand-success/10 flex items-center justify-center shrink-0 mt-0.5">
                 <span className="text-brand-success font-bold text-[10px]">2</span>
              </div>
              <span>You will receive final deliverables directly in your email within the agreed timeframe.</span>
            </li>
            <li className="flex gap-3">
              <div className="h-5 w-5 rounded-md bg-brand-success/10 flex items-center justify-center shrink-0 mt-0.5">
                 <span className="text-brand-success font-bold text-[10px]">3</span>
              </div>
              <span>If for any reason the creator cannot fulfill the order, your payment is safely refunded.</span>
            </li>
          </ul>
        </div>
        
        <div className="pt-4 space-y-3">
          {creator ? (
            <>
              <Link href={`/book/${creator}`}>
                <Button className="w-full h-12 text-[15px] gap-2 shadow-[0_2px_12px_rgba(15,100,67,0.35)]">
                  <Sparkles className="h-4 w-4" />
                  View More Packages
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="ghost" className="w-full text-[13px] text-text-muted hover:text-text-primary">
                  Return Home
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/">
              <Button className="w-full h-12 text-[15px] gap-2">
                Return Home <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

      </div>
    </div>
  )
}
