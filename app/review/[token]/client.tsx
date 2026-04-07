'use client'

import { useState } from 'react'
import { Check, RotateCcw, Download, Star, FileText } from 'lucide-react'
import Image from 'next/image'
import { submitClientReview } from '@/actions/approvals'
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
} from '@/types/approvals'
import type { ApprovalStatus } from '@/types/approvals'

type ReviewClientProps = {
  approval: Record<string, unknown> & {
    id: string
    status: string
    comments: string | null
    deadline: string | null
    organizations?: { name: string; logo_url: string | null }
    creative_briefs?: { title: string; channel_type: string; objective?: string; key_messages?: string }
    creative_files?: { file_name: string; file_url: string; file_type: string | null; file_size: number | null; version: number; is_final: boolean }
  }
  token: string
}

export function ReviewClient({ approval, token }: ReviewClientProps) {
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(approval.status !== 'pending')
  const [result, setResult] = useState<'approved' | 'revision_requested' | null>(
    approval.status !== 'pending' ? (approval.status as 'approved' | 'revision_requested') : null
  )

  const orgName = approval.organizations?.name ?? 'AdDesk'
  const brief = approval.creative_briefs
  const file = approval.creative_files
  const isImage = file?.file_type?.startsWith('image/')

  async function handleSubmit(decision: 'approved' | 'revision_requested') {
    setSubmitting(true)
    const res = await submitClientReview(token, decision, comments)
    if (res.success) {
      setSubmitted(true)
      setResult(decision)
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="flex items-center gap-3">
            {approval.organizations?.logo_url ? (
              <Image
                src={approval.organizations.logo_url}
                alt={orgName}
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm">
                {orgName[0]}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-zinc-900">{orgName}</p>
              <p className="text-xs text-zinc-400">Creative Review</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        {/* Brief Info */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{brief?.title}</h1>
          <p className="mt-1 text-sm text-zinc-500 capitalize">
            {brief?.channel_type?.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Status Banner (if already reviewed) */}
        {submitted && (
          <div
            className={`rounded-xl px-5 py-4 ${
              APPROVAL_STATUS_COLORS[result as ApprovalStatus] ??
              'bg-zinc-100 text-zinc-600'
            }`}
          >
            <p className="text-sm font-bold">
              {result === 'approved'
                ? 'You approved this creative.'
                : result === 'revision_requested'
                ? 'You requested revisions.'
                : APPROVAL_STATUS_LABELS[approval.status as ApprovalStatus]}
            </p>
            {approval.comments && (
              <p className="mt-1 text-sm opacity-80">{approval.comments}</p>
            )}
          </div>
        )}

        {/* Brief Details */}
        {(brief?.objective || brief?.key_messages) && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            {brief.objective && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-1">
                  Objective
                </h3>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                  {brief.objective}
                </p>
              </div>
            )}
            {brief.key_messages && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-1">
                  Key Messages
                </h3>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                  {brief.key_messages}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Creative File Preview */}
        {file && (
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-900">
                  {file.file_name}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                  v{file.version}
                </span>
                {file.is_final && (
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                )}
              </div>
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </div>
            {isImage && (
              <div className="bg-zinc-100 p-4">
                <Image
                  src={file.file_url}
                  alt={file.file_name}
                  width={800}
                  height={500}
                  className="mx-auto max-h-125 rounded-lg object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>
        )}

        {/* Deadline */}
        {approval.deadline && (
          <p className="text-sm text-zinc-500">
            <span className="font-medium text-zinc-700">Review by: </span>
            {new Date(approval.deadline).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}

        {/* Review Form */}
        {!submitted && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-zinc-900">
              Your Feedback
            </h2>

            <div>
              <label
                htmlFor="comments"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Comments (optional)
              </label>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors resize-none"
                placeholder="Share your thoughts on the creative..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit('approved')}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Check className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => handleSubmit('revision_requested')}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Request Revisions
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
