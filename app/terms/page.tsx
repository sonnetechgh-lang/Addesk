import Link from "next/link"
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2 } from "lucide-react"

export const metadata = {
  title: "Terms of Service - AdDesk",
  description: "Terms of Service for AdDesk users and clients.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-light font-sans text-text-primary selection:bg-brand-primary/20 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[20px_20px] opacity-40 pointer-events-none" />

      <main className="relative z-10 w-full px-4 py-6 sm:px-6 sm:py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-5 sm:mb-8">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-card px-3 py-2 text-xs font-semibold text-text-secondary transition-all hover:text-text-primary hover:shadow-sm sm:text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>

          <section className="rounded-3xl border border-border bg-surface-card shadow-elevation-low overflow-hidden">
            <div className="border-b border-border bg-linear-to-r from-brand-primary/6 via-transparent to-brand-accent/6 px-4 py-6 sm:px-8 sm:py-8">
              <div className="mb-4 inline-flex items-center justify-center rounded-2xl border border-[#d1e7dd] bg-[#edf5f1] p-3">
                <ShieldCheck className="h-7 w-7 text-[#0f6443] sm:h-8 sm:w-8" />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl md:text-5xl">Terms of Service</h1>
                  <p className="mt-2 text-sm text-text-secondary sm:text-base">
                    The rules for using AdDesk as a Creator or Client.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-card px-3 py-2 text-xs font-medium text-text-secondary sm:text-sm">
                  <FileText className="h-4 w-4" />
                  Updated: October 24, 2024 (v1.0)
                </div>
              </div>
            </div>

            <div className="space-y-5 px-4 py-6 sm:px-8 sm:py-8">
              <p className="text-sm leading-7 text-text-secondary sm:text-base sm:leading-8">
                Welcome to AdDesk. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the AdDesk platform, including all related websites, software, and services (collectively, the &quot;Services&quot;). By using our Services, you agree to these Terms. If you do not agree, do not use the Services.
              </p>

              <section className="rounded-2xl border border-border bg-surface-lighter p-4 sm:p-5">
                <h2 className="text-lg font-bold text-text-primary sm:text-xl">1. Use of Services</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary sm:text-base">
                  AdDesk provides a platform for influencers (&quot;Creators&quot;) to offer advertising and promotional services to brands and individuals (&quot;Clients&quot;).
                </p>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary sm:text-base">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                    <span><strong className="text-text-primary">For Creators:</strong> You must provide accurate information when onboarding. You are responsible for fulfilling the terms of any orders you accept.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                    <span><strong className="text-text-primary">For Clients:</strong> When you book a Creator through AdDesk, you agree to pay the specified fees upfront. Bookings are subject to the Creator&apos;s acceptance and availability.</span>
                  </li>
                </ul>
              </section>

              <section className="rounded-2xl border border-border bg-surface-lighter p-4 sm:p-5">
                <h2 className="text-lg font-bold text-text-primary sm:text-xl">2. Payments and Processing</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary sm:text-base">
                  All payments are processed securely via our third-party payment partner, Paystack. By making or accepting a payment on AdDesk, you agree to comply with Paystack&apos;s terms of service.
                </p>
              </section>

              <section className="rounded-2xl border border-border bg-surface-lighter p-4 sm:p-5">
                <h2 className="text-lg font-bold text-text-primary sm:text-xl">3. Prohibited Conduct</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary sm:text-base">Users may not use AdDesk to:</p>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary sm:text-base">
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" /><span>Violate any applicable laws or regulations.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" /><span>Promote illegal, harmful, or offensive content.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" /><span>Attempt to bypass the platform&apos;s payment systems.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" /><span>Impersonate another person or entity.</span></li>
                </ul>
              </section>

              <section className="rounded-2xl border border-border bg-surface-lighter p-4 sm:p-5">
                <h2 className="text-lg font-bold text-text-primary sm:text-xl">4. Limitation of Liability</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary sm:text-base">
                  AdDesk acts as a facilitator between Creators and Clients. We do not guarantee the performance, quality, or outcome of any promotional services provided. To the fullest extent permitted by law, AdDesk shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Services.
                </p>
              </section>

              <section className="rounded-2xl border border-border bg-surface-lighter p-4 sm:p-5">
                <h2 className="text-lg font-bold text-text-primary sm:text-xl">5. Modifications</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary sm:text-base">
                  We may update these Terms from time to time. If we make material changes, we will notify you and require you to accept the updated Terms before continuing to use the Services.
                </p>
              </section>

              <div className="rounded-2xl border border-border bg-surface-light p-4 text-center text-sm text-text-secondary sm:p-5 sm:text-base">
                If you have any questions about these Terms, contact legal@addesk.io.
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
