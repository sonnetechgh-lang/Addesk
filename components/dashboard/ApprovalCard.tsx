'use client'

import Link from 'next/link'
import { Mail, Trash2, Copy } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
} from '@/types/approvals'
import type { ApprovalStatus } from '@/types/approvals'
import { resendApprovalEmail, deleteApprovalRequest } from '@/actions/approvals'
import { useRouter } from 'next/navigation'

type ApprovalCardProps = {
  approval: {
    id: string
    status: string
    client_email: string
    review_token: string
    deadline: string | null
    created_at: string
    reviewed_at: string | null
    comments: string | null
    creative_briefs: { id: string; title: string; channel_type: string }
    creative_files: {
      file_name: string
      file_url: string
      version: number
      is_final: boolean
    } | null
    clients: { company_name: string; contact_name: string } | null
    profiles: { full_name: string }
  }
}

export function ApprovalCard({ approval }: ApprovalCardProps) {
  const router = useRouter()
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  async function handleResend() {
    await resendApprovalEmail(approval.id)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this approval request?')) return
    await deleteApprovalRequest(approval.id)
    router.refresh()
  }

  function handleCopyLink() {
    const url = `${appUrl}/review/${approval.review_token}`
    navigator.clipboard.writeText(url)
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <Link
          href={`/dashboard/briefs/${approval.creative_briefs.id}`}
          className="font-bold text-zinc-900 truncate hover:text-emerald-700 transition-colors"
        >
          {approval.creative_briefs.title}
        </Link>
        <span
          className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            APPROVAL_STATUS_COLORS[approval.status as ApprovalStatus] ??
            'bg-zinc-100 text-zinc-600'
          }`}
        >
          {APPROVAL_STATUS_LABELS[approval.status as ApprovalStatus] ??
            approval.status}
        </span>
      </div>

      <div className="space-y-1 text-xs text-zinc-500 mb-3">
        <p>
          <span className="text-zinc-400">To: </span>
          {approval.clients?.company_name
            ? `${approval.clients.company_name} (${approval.client_email})`
            : approval.client_email}
        </p>
        {approval.creative_files && (
          <p>
            <span className="text-zinc-400">File: </span>
            {approval.creative_files.file_name} v{approval.creative_files.version}
          </p>
        )}
        {approval.deadline && (
          <p>
            <span className="text-zinc-400">Deadline: </span>
            {new Date(approval.deadline).toLocaleDateString()}
          </p>
        )}
        <p>
          <span className="text-zinc-400">Sent: </span>
          {formatDistanceToNow(new Date(approval.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>

      {/* Client feedback */}
      {approval.comments && (
        <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600 mb-3">
          <span className="font-medium">Client feedback: </span>
          {approval.comments}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-zinc-100 pt-3">
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-zinc-500 hover:bg-zinc-100 transition-colors"
          title="Copy review link"
        >
          <Copy className="h-3 w-3" />
          Link
        </button>
        {approval.status === 'pending' && (
          <button
            onClick={handleResend}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-zinc-500 hover:bg-zinc-100 transition-colors"
            title="Resend email"
          >
            <Mail className="h-3 w-3" />
            Resend
          </button>
        )}
        <button
          onClick={handleDelete}
          className="ml-auto rounded-lg p-1 text-zinc-300 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
