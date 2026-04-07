// =============================================================
// Approval Request Type Definitions
// =============================================================

export const APPROVAL_STATUSES = [
  'pending',
  'approved',
  'revision_requested',
  'expired',
] as const
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  revision_requested: 'Revision Requested',
  expired: 'Expired',
}

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  revision_requested: 'bg-red-50 text-red-600',
  expired: 'bg-zinc-100 text-zinc-500',
}

// -------------------------------------------------------
// Database Row Type
// -------------------------------------------------------

export type ApprovalRequest = {
  id: string
  brief_id: string
  organization_id: string
  creative_file_id: string | null
  client_id: string | null
  client_email: string
  status: ApprovalStatus
  review_token: string
  comments: string | null
  reviewed_at: string | null
  deadline: string | null
  created_by: string
  created_at: string
}

// -------------------------------------------------------
// Composite Types
// -------------------------------------------------------

export type ApprovalWithDetails = ApprovalRequest & {
  creative_briefs: {
    id: string
    title: string
    channel_type: string
  }
  creative_files: {
    file_name: string
    file_url: string
    file_type: string | null
    version: number
    is_final: boolean
  } | null
  clients: {
    company_name: string
    contact_name: string
  } | null
  profiles: {
    full_name: string
  }
}
