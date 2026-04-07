'use client'

import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from '@/types/billing'
import type { InvoiceStatus } from '@/types/billing'
import { BarChart3, TrendingUp, AlertCircle, Users } from 'lucide-react'

function formatGHS(pesewas: number) {
  return `GHS ${(pesewas / 100).toFixed(2)}`
}

type Props = {
  revenueReport: {
    monthly: {
      period: string
      revenue: number
      paid: number
      outstanding: number
      count: number
    }[]
    summary: { total: number; paid: number; outstanding: number }
  }
  outstanding: { id: string; invoice_number: string; total: number; due_date: string | null; status: string; clients?: { company_name: string } }[]
  byClient: { clientName: string; total: number; count: number }[]
}

export function ReportsDashboard({
  revenueReport,
  outstanding,
  byClient,
}: Props) {
  const { monthly, summary } = revenueReport

  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Reports</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Revenue overview and financial insights.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">
                Total Revenue
              </p>
              <p className="text-xl font-bold text-zinc-900">
                {formatGHS(summary.total)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Collected</p>
              <p className="text-xl font-bold text-zinc-900">
                {formatGHS(summary.paid)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Outstanding</p>
              <p className="text-xl font-bold text-zinc-900">
                {formatGHS(summary.outstanding)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart (simple bar chart) */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-zinc-900">
          Monthly Revenue
        </h2>
        {monthly.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            No revenue data yet.
          </p>
        ) : (
          <div className="flex items-end gap-2" style={{ height: 200 }}>
            {monthly.map((m) => {
              const pct = (m.revenue / maxRevenue) * 100
              return (
                <div
                  key={m.period}
                  className="group relative flex flex-1 flex-col items-center"
                >
                  <div
                    className="w-full max-w-12 rounded-t-lg bg-emerald-500 transition-colors group-hover:bg-emerald-600"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <span className="mt-2 text-[10px] text-zinc-400">
                    {m.period}
                  </span>
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {formatGHS(m.revenue)} ({m.count} inv)
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Outstanding Invoices */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-6 py-4">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-bold text-zinc-900">
              Outstanding Invoices
            </h2>
          </div>
          {outstanding.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-400">
              No outstanding invoices.
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {outstanding.slice(0, 10).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {inv.invoice_number}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {inv.clients?.company_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatGHS(inv.total)}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        INVOICE_STATUS_COLORS[inv.status as InvoiceStatus]
                      }`}
                    >
                      {INVOICE_STATUS_LABELS[inv.status as InvoiceStatus]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by Client */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-6 py-4">
            <Users className="h-4 w-4 text-blue-500" />
            <h2 className="text-base font-bold text-zinc-900">
              Revenue by Client
            </h2>
          </div>
          {byClient.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-400">
              No client revenue data yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {byClient.slice(0, 10).map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {c.clientName}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {c.count} invoice{c.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {formatGHS(c.total)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
