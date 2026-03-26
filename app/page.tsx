import Link from "next/link";
import {
  Zap,
  Check,
  LayoutDashboard,
  Send,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-surface-light text-text-primary selection:bg-brand-success/30 overflow-hidden relative">
      
      {/* ── BACKGROUND PATTERN ── */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[20px_20px] opacity-40 pointer-events-none" />

      {/* ── HEADER ── */}
      <header className="fixed top-0 z-50 w-full h-20 flex items-center px-6 lg:px-12 bg-surface-card/70 backdrop-blur-xl border-b border-border shadow-sm">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-text-primary group hover:opacity-80 transition-opacity"
        >
          <div className="grid grid-cols-2 gap-0.5 w-6 h-6 items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-success" />
            <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary" />
            <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary" />
            <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary" />
          </div>
          <span>AdDesk</span>
        </Link>

        <div className="ml-auto md:ml-12 flex items-center gap-6">
          <Link href="/login" className="hidden sm:block">
            <span className="text-text-secondary hover:text-text-primary text-[14px] font-semibold transition-colors">
              Sign in
            </span>
          </Link>
          <Link href="/signup">
            <Button variant="outline" size="md" className="rounded-full">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-20 relative z-10 w-full mb-32">
        {/* ── HERO SECTION ── */}
        <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center pt-10 pb-20 px-6">
           
          {/* Main Content */}
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center mt-12 sm:mt-24 animate-fade-in-up">
             <div className="w-16 h-16 rounded-3xl bg-surface-card shadow-md border border-border flex items-center justify-center mb-8 hover:scale-110 transition-transform cursor-default">
               <div className="grid grid-cols-2 gap-0.75 w-8 h-8 items-center justify-center">
                 <div className="w-3.5 h-3.5 rounded-full bg-brand-success" />
                 <div className="w-3.5 h-3.5 rounded-full bg-brand-secondary" />
                 <div className="w-3.5 h-3.5 rounded-full bg-brand-secondary" />
                 <div className="w-3.5 h-3.5 rounded-full bg-brand-secondary" />
               </div>
             </div>

            <h1 className="font-sans font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight mb-6 text-text-primary max-w-3xl">
              Monetize, plan, and track{" "}
              <span className="bg-linear-to-r from-brand-success to-brand-success-light bg-clip-text text-transparent">all in one place</span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-10 pb-2">
              Efficiently manage your creative ad tasks, organize briefs, and boost productivity with instant Paystack payments.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" variant="success" className="shadow-lg hover:shadow-xl">
                  Start creating free
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="secondary">
                  Try demo
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="secondary">
                  Learn more
                </Button>
              </Link>
            </div>
          </div>

          {/* ── FLOATING UI ELEMENTS (Hero Decor) ── */}
          {/* Top Left Yellow Note */}
          <div className="absolute top-24 left-[5%] xl:left-[12%] transform -rotate-6 hidden lg:block hover:rotate-0 hover:scale-105 transition-all duration-500 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
             <div className="bg-amber-50 shadow-elevation-medium border border-border w-64 p-6 font-medium text-amber-900 leading-tight text-lg rounded-2xl relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-error shadow-sm shadow-error/50" />
                Take notes to keep track of crucial campaign details, and accomplish more briefs with ease.
             </div>
             {/* Simple white overlapping icon */}
             <div className="absolute -bottom-8 -right-4 w-20 h-20 bg-surface-card shadow-elevation-medium border border-border flex items-center justify-center rounded-3xl">
                <div className="w-10 h-10 bg-brand-success rounded-lg flex items-center justify-center">
                  <Check className="text-white w-6 h-6" />
                </div>
             </div>
          </div>

          {/* Bottom Left Tasks Box */}
          <div className="absolute bottom-10 left-[2%] xl:left-[8%] transform rotate-3 hidden lg:block hover:-rotate-2 hover:scale-105 transition-all duration-500 animate-slide-in-left" style={{ animationDelay: '0.4s' }}>
             <div className="bg-surface-card shadow-elevation-medium rounded-3xl p-6 w-85 border border-border">
               <h3 className="font-bold text-text-primary mb-4 text-lg">Today&apos;s briefs</h3> 
               
               <div className="space-y-5">
                 <div>
                   <div className="flex justify-between text-xs mb-2">
                     <span className="font-semibold text-text-secondary flex items-center gap-2">
                       <span className="w-5 h-5 rounded-md bg-warning/15 text-warning flex items-center justify-center text-xs">1</span> New Ideas for campaign
                     </span>
                     <span className="text-text-muted">60%</span>
                   </div>
                   <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
                     <div className="h-full bg-brand-success rounded-full" style={{ width: '60%' }}></div>
                   </div>
                 </div>

                 <div>
                   <div className="flex justify-between text-xs mb-2">
                     <span className="font-semibold text-text-secondary flex items-center gap-2">
                       <span className="w-5 h-5 rounded-md bg-success/15 text-success flex items-center justify-center text-xs">2</span> Design PPT #4
                     </span>
                     <span className="text-text-muted">100%</span>
                   </div>
                   <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
                     <div className="h-full bg-success rounded-full" style={{ width: '100%' }}></div>
                   </div>
                 </div>
               </div>
             </div>
          </div>

          {/* Top Right Reminders */}
          <div className="absolute top-32 right-[5%] xl:right-[15%] transform rotate-6 hidden lg:block hover:rotate-3 hover:scale-105 transition-all duration-500 animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
             <div className="relative">
               <div className="bg-surface-card shadow-elevation-medium rounded-3xl p-5 w-64 border border-border z-10 relative">
                 <div className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Reminders</div>
                 <h4 className="font-bold text-text-primary mb-1">Incoming Request</h4>
                 <p className="text-xs text-text-secondary mb-3">MTN Ad Campaign Brief</p>
                 <div className="bg-brand-success/10 text-brand-success text-xs font-bold py-1.5 px-3 rounded-lg inline-block">
                   GHS 5,200.00
                 </div>
               </div>
               {/* Floating Icon overlapping */}
               <div className="absolute -left-10 top-10 w-20 h-20 bg-surface-card shadow-elevation-medium border border-border flex items-center justify-center rounded-3xl z-20 hover:shadow-elevation-high transition-shadow">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-[80%] h-[80%] text-text-secondary" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
               </div>
             </div>
          </div>

          {/* Bottom Right Integrations */}
          <div className="absolute bottom-20 right-[2%] xl:right-[10%] transform -rotate-3 hidden lg:block hover:rotate-1 hover:scale-105 transition-all duration-500 animate-slide-in-right" style={{ animationDelay: '0.5s' }}>
             <div className="bg-surface-card shadow-elevation-medium rounded-3xl p-6 w-75 border border-border relative pt-12">
               <div className="absolute top-4 left-6 text-sm font-bold text-text-secondary">Simple Checkouts</div>
               
               <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-2xl bg-surface-light shadow-sm border border-border flex items-center justify-center text-2xl font-bold text-brand-success">
                   P
                 </div>
                 <div className="w-16 h-16 rounded-2xl bg-surface-light shadow-sm border border-border flex items-center justify-center">
                   <Zap className="h-8 w-8 text-warning fill-warning" />
                 </div>
                 <div className="w-16 h-16 rounded-2xl bg-surface-light shadow-sm border border-border flex items-center justify-center font-bold text-text-primary">
                   MoMo
                 </div>
               </div>
             </div>
          </div>

        </section>

        {/* ── BENTO GRID FEATURES ── */}
        <section id="features" className="w-full pt-10 pb-32 relative z-20">
          <div className="container px-6 max-w-6xl mx-auto">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
              {/* Box 1 (Span 2) */}
              <div className="md:col-span-2 relative group rounded-3xl p-8 overflow-hidden bg-surface-card shadow-elevation-low border border-border hover:shadow-elevation-medium hover:border-brand-success/50 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="absolute inset-0 bg-linear-to-br from-brand-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-brand-success/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <LayoutDashboard className="h-8 w-8 text-brand-success" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-text-primary">
                      One Unified Dashboard
                    </h3>
                    <p className="text-text-secondary text-lg max-w-md">
                      Manage your packages, track briefs from clients, and
                      monitor your earnings in one beautifully designed
                      workspace.
                    </p>
                  </div>
                </div>
              </div>

              {/* Box 2 */}
              <div className="relative group rounded-3xl p-8 overflow-hidden bg-surface-card shadow-elevation-low border border-border hover:shadow-elevation-medium hover:border-brand-success/50 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="absolute inset-0 bg-linear-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Send className="h-8 w-8 text-brand-accent" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-text-primary">Custom Link</h3>
                    <p className="text-text-secondary font-medium">A custom public link with all our Ad packages to add to your Socials </p>
                    <p className="text-text-secondary font-medium text-sm">addesk.io/yourname</p>
                  </div>
                </div>
              </div>

              {/* Box 3 */}
              <div className="relative group rounded-3xl p-8 overflow-hidden bg-surface-card shadow-elevation-low border border-border hover:shadow-elevation-medium hover:border-brand-success/50 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="absolute inset-0 bg-linear-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-text-primary">Instant Payouts</h3>
                    <p className="text-text-secondary font-medium leading-relaxed">
                      Get paid securely via MTN MoMo, AT Money & Telecel Cash.
                    </p>
                  </div>
                </div>
              </div>

              {/* Box 4 (Span 2) */}
              <div className="md:col-span-2 relative group rounded-3xl p-8 overflow-hidden bg-surface-card shadow-elevation-low border border-border hover:shadow-elevation-medium hover:border-brand-success/50 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="absolute inset-0 bg-linear-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Layers className="h-8 w-8 text-warning" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-2xl font-bold mb-3 text-text-primary">
                      Package Management
                    </h3>
                    <p className="text-text-secondary text-lg">
                      Define specific offerings, physical delivery
                      requirements, and revisions effortlessly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full py-12 border-t border-border bg-surface-light">
        <div className="container px-6 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="grid grid-cols-2 gap-0.5 w-5 h-5 items-center justify-center">
               <div className="w-2 h-2 rounded-full bg-brand-success" />
               <div className="w-2 h-2 rounded-full bg-brand-secondary" />
               <div className="w-2 h-2 rounded-full bg-brand-secondary" />
               <div className="w-2 h-2 rounded-full bg-brand-secondary" />
             </div>
            <span className="font-bold text-lg text-text-primary">AdDesk</span>
          </div>

          <div className="flex items-center gap-6 text-[13px] font-semibold text-text-secondary">
            <Link href="/terms" className="hover:text-text-primary transition-colors">
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-text-primary transition-colors"
            >
              Privacy Policy
            </Link>
          </div>

          <p className="text-[13px] text-slate-400 font-medium">
            © {new Date().getFullYear()} AdDesk. All rights reserved.
          </p>
          <p className="text-[13px] text-slate-400 font-medium"> Developed by <a href="https://www.sonnetghana.com/">Sonnet Solutions</a>  
          </p>
        </div>
      </footer>
    </div>
  );
}
