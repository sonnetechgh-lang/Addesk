export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-light p-4 sm:p-8 font-sans text-text-primary">
      <div className="w-full max-w-3xl bg-surface-card rounded-2xl sm:rounded-3xl shadow-sm border border-border p-6 sm:p-12 md:p-16">
        <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-brand-secondary">Welcome to AdDesk</h1>
            <p className="text-text-secondary mt-3 sm:mt-4 text-base sm:text-lg">Let's get your profile set up so you can start accepting orders.</p>
        </div>
        {children}
      </div>
    </div>
  )
}
