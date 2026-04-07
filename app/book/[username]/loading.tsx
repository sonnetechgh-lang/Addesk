export default function Loading() {
  return (
    <div className="min-h-screen bg-surface-light">
      <div className="h-48 sm:h-64 w-full bg-surface-card animate-pulse" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="bg-surface-card rounded-2xl border border-border p-8 text-center space-y-6 mb-12 shadow-[0_1px_3px_rgba(0,0,0,0.06)] relative">
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 h-28 w-28 rounded-2xl bg-surface-light animate-pulse" />
          <div className="pt-12 space-y-3">
            <div className="h-8 w-48 mx-auto bg-surface-light animate-pulse rounded" />
            <div className="h-4 w-32 mx-auto bg-surface-light animate-pulse rounded" />
          </div>
          <div className="h-4 w-64 mx-auto bg-surface-light animate-pulse rounded" />
        </div>

        <div className="space-y-4">
          <div className="h-8 w-56 bg-surface-light animate-pulse rounded" />
          <div className="grid gap-8 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-72 bg-surface-light animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
