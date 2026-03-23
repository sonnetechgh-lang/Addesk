'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, Zap } from "lucide-react"
import { acceptInfluencerTerms } from "@/app/actions/consent"
import Link from "next/link"

export default function TermsOnboardingPage() {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAccept = async () => {
    if (!accepted) {
      setError("You must accept the terms to continue.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await acceptInfluencerTerms()
      if (result.success) {
        router.push("/dashboard")
        router.refresh()
      } else {
        setError(result.error || "Failed to accept terms.")
        setLoading(false)
      }
    } catch (err) {
      setError("An unexpected error occurred.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-light flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-text-primary selection:bg-brand-success/20">

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="h-9 w-9 rounded-xl bg-[#0f6443] flex items-center justify-center shadow-sm">
          <Zap className="h-4.5 w-4.5 text-white fill-white" />
        </div>
        <span className="font-bold text-xl text-text-primary tracking-tight">AdDesk</span>
      </div>

      <div className="w-full max-w-2xl bg-surface-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-[0_1px_4px_rgba(0,0,0,0.06)] relative">
        
        <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-[#edf5f1] border border-[#d1e7dd] mb-5 sm:mb-6">
          <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 text-[#0f6443]" />
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-text-primary mb-2">Terms of Service</h1>
        <p className="text-text-secondary text-sm sm:text-base mb-6 sm:mb-8 max-w-lg">
          We&apos;ve updated our Terms of Service. Please review and accept them to access your AdDesk dashboard.
        </p>

        {/* Terms Preview Box */}
        <div className="bg-surface-light border border-border rounded-2xl p-4 sm:p-6 h-48 sm:h-64 overflow-y-auto mb-6 sm:mb-8 relative">
           <div className="prose prose-sm text-text-secondary max-w-none">
             <h3 className="text-text-primary font-bold text-base">1. Welcome to AdDesk</h3>
             <p>By using the AdDesk platform, you agree to comply with our Terms of Service. These terms outline your responsibilities as a Creator on our platform.</p>
             
             <h3 className="text-text-primary font-bold text-base">2. Payouts &amp; Fees</h3>
             <p>All transactions are processed securely via Paystack. AdDesk may deduct standard processing fees according to your selected payout method.</p>

             <h3 className="text-text-primary font-bold text-base">3. Conduct</h3>
             <p>As an influencer on our network, you agree not to engage in fraudulent bookings or deceptive practices. Violations may result in account termination.</p>

             <h3 className="text-text-primary font-bold text-base">4. Liability</h3>
             <p>AdDesk is a facilitator of sponsorships. We do not take responsibility for the direct outcomes of the advertisements provided, or breaches of contract by external clients.</p>
             
             <p>...</p>
           </div>
           
           <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface-light to-transparent pointer-events-none rounded-b-2xl" />
        </div>

        {/* Checkbox + Button */}
        <div className="flex flex-col gap-4 sm:gap-5">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5 shrink-0">
              <input 
                type="checkbox" 
                className="peer sr-only"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked)
                  if(e.target.checked) setError("")
                }}
              />
              <div className="h-6 w-6 rounded-lg bg-surface-light border-2 border-border peer-checked:bg-[#0f6443] peer-checked:border-[#0f6443] transition-all flex items-center justify-center group-hover:border-[#0f6443]/50">
                <svg className={`h-3.5 w-3.5 text-white transition-opacity ${accepted ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-sm font-medium text-text-secondary leading-relaxed">
              I have read and agree to the <Link href="/terms" target="_blank" className="text-brand-success hover:text-brand-success/80 font-semibold transition-colors underline underline-offset-2">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="text-brand-success hover:text-brand-success/80 font-semibold transition-colors underline underline-offset-2">Privacy Policy</Link>.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!accepted || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f6443] px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#0d5438] hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept & Continue'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 text-error text-sm font-medium bg-error/8 border border-error/20 p-3 rounded-xl animate-fade-in-up">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

      </div>
    </div>
  )
}
