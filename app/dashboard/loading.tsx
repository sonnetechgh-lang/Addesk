import { Activity, Eye, Package, Wallet } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 pb-12 animate-pulse-soft">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-gray-200 rounded-lg"></div>
          <div className="h-5 w-64 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-11 w-40 bg-gray-200 rounded-full"></div>
          <div className="h-11 w-24 bg-gray-200 rounded-full"></div>
        </div>
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-card border border-border rounded-3xl p-6 h-36">
            <div className="h-4 w-24 bg-gray-100 rounded mb-4"></div>
            <div className="h-10 w-32 bg-gray-100 rounded mb-2"></div>
            <div className="h-4 w-20 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Middle Grid Skeleton */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4 bg-surface-card border border-border rounded-3xl p-6 h-80 flex flex-col items-center justify-center">
          <div className="h-40 w-40 rounded-full bg-gray-100 mb-6"></div>
          <div className="h-4 w-32 bg-gray-100 rounded"></div>
        </div>

        <div className="lg:col-span-8 bg-surface-card border border-border rounded-3xl p-6 h-80">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-32 bg-gray-100 rounded"></div>
            <div className="h-8 w-20 bg-gray-100 rounded-full"></div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-100 rounded"></div>
                    <div className="h-3 w-32 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
