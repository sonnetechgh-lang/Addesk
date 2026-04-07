'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
    >
      Print / Download PDF
    </button>
  )
}
