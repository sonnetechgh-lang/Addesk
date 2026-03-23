import Link from "next/link"
import { ArrowLeft, LockKeyhole, FileText, CheckCircle2 } from "lucide-react"

export const metadata = {
  title: "Privacy Policy - AdDesk",
  description: "Privacy Policy for AdDesk.",
}

export default function PrivacyPage() {
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
              <div className="mb-4 inline-flex items-center justify-center rounded-2xl border border-border bg-surface-light p-3">
                <LockKeyhole className="h-7 w-7 text-text-secondary sm:h-8 sm:w-8" />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl md:text-5xl">Privacy Policy</h1>
                  <p className="mt-2 text-sm text-text-secondary sm:text-base">
                    How AdDesk collects, uses, and protects your information.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-card px-3 py-2 text-xs font-medium text-text-secondary sm:text-sm">
                  <FileText className="h-4 w-4" />
                  Updated: October 24, 2024
                </div>
              </div>
            </div>

            <div className="space-y-5 px-4 py-6 sm:px-8 sm:py-8">
              <p className="text-sm leading-7 text-text-secondary sm:text-base sm:leading-8">
                At AdDesk, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our platform.
              </p>

              <section className="rounded-2xl border border-border bg-surface-lighter p-4 sm:p-5">
                <h2 className="text-lg font-bold text-text-primary sm:text-xl">1. Information We Collect</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary sm:text-base">We collect information that you provide directly to us when you:</p>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary sm:text-base">
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" /><span>Register for an account (name, email address, social media links).</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" /><span>Book a package (client name, email, brief details).</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" /><span>Communicate with us for support.</span></li>
                </ul>
                <p className="mt-3 text-sm leading-7 text-text-secondary sm:text-base">
                  We also automatically collect certain information about your device and how you interact with our platform, including IP addresses, browser types, and usage data.
                </p>
              </section>

              <section className="rounded-2xl border border-border bg-surface-lighter p-4 sm:p-5">
                <h2 className="text-lg font-bold text-text-primary sm:text-xl">2. How We Use Your Information</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary sm:text-base">We use the information we collect to:</p>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary sm:text-base">
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" /><span>Provide, operate, and maintain the AdDesk platform.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" /><span>Process transactions and send related information (for example confirmations and receipts).</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" /><span>Send administrative and promotional emails.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" /><span>Improve and personalize our services.</span></li>
                </ul>
              </section>

              <section className="rounded-2xl border border-border bg-surface-lighter p-4 sm:p-5">
                <h2 className="text-lg font-bold text-text-primary sm:text-xl">3. Sharing Your Information</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary sm:text-base">
                  We may share your information with third-party vendors and service providers that perform services on our behalf, such as payment processing (Paystack) and email delivery (Resend). We do not sell your personal information to third parties.
                </p>
              </section>

              <section className="rounded-2xl border border-border bg-surface-lighter p-4 sm:p-5">
                <h2 className="text-lg font-bold text-text-primary sm:text-xl">4. Data Security</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary sm:text-base">
                  We implement reasonable security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is fully secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section className="rounded-2xl border border-border bg-surface-lighter p-4 sm:p-5">
                <h2 className="text-lg font-bold text-text-primary sm:text-xl">5. Your Rights</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary sm:text-base">
                  Depending on your location, you may have the right to access, update, or delete your personal information. If you wish to exercise these rights, please contact us.
                </p>
              </section>

              <div className="rounded-2xl border border-border bg-surface-light p-4 text-center text-sm text-text-secondary sm:p-5 sm:text-base">
                If you have any questions about this Privacy Policy, contact privacy@addesk.io.
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
