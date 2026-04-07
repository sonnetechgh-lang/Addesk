// =============================================================
// Creative Brief, Production Task & File Type Definitions
// =============================================================

// -------------------------------------------------------
// Brief Statuses
// -------------------------------------------------------

export const BRIEF_STATUSES = [
  'draft',
  'assigned',
  'in_production',
  'internal_review',
  'client_review',
  'approved',
  'final',
] as const
export type BriefStatus = (typeof BRIEF_STATUSES)[number]

export const BRIEF_STATUS_LABELS: Record<BriefStatus, string> = {
  draft: 'Draft',
  assigned: 'Assigned',
  in_production: 'In Production',
  internal_review: 'Internal Review',
  client_review: 'Client Review',
  approved: 'Approved',
  final: 'Final',
}

export const BRIEF_STATUS_COLORS: Record<BriefStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  assigned: 'bg-blue-50 text-blue-700',
  in_production: 'bg-purple-50 text-purple-700',
  internal_review: 'bg-amber-50 text-amber-700',
  client_review: 'bg-orange-50 text-orange-700',
  approved: 'bg-emerald-50 text-emerald-700',
  final: 'bg-green-50 text-green-700',
}

// -------------------------------------------------------
// Task Types & Statuses
// -------------------------------------------------------

export const TASK_TYPES = [
  'design',
  'copywriting',
  'voiceover',
  'filming',
  'editing',
  'typesetting',
  'qc',
] as const
export type TaskType = (typeof TASK_TYPES)[number]

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  design: 'Design',
  copywriting: 'Copywriting',
  voiceover: 'Voiceover',
  filming: 'Filming',
  editing: 'Editing',
  typesetting: 'Typesetting',
  qc: 'Quality Check',
}

export const TASK_STATUSES = [
  'todo',
  'in_progress',
  'review',
  'done',
  'blocked',
] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  blocked: 'Blocked',
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-zinc-100 text-zinc-600',
  in_progress: 'bg-blue-50 text-blue-700',
  review: 'bg-amber-50 text-amber-700',
  done: 'bg-emerald-50 text-emerald-700',
  blocked: 'bg-red-50 text-red-600',
}

export const PRIORITY_LEVELS = ['low', 'medium', 'high', 'urgent'] as const
export type Priority = (typeof PRIORITY_LEVELS)[number]

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'text-zinc-400',
  medium: 'text-blue-500',
  high: 'text-amber-500',
  urgent: 'text-red-500',
}

// -------------------------------------------------------
// Database Row Types
// -------------------------------------------------------

export type Deliverable = {
  type: string
  description: string
  quantity?: number
}

export type CreativeBrief = {
  id: string
  organization_id: string
  line_item_id: string | null
  order_id: string | null
  campaign_id: string | null
  channel_type: string
  title: string
  objective: string | null
  target_audience: string | null
  key_messages: string | null
  deliverables: Deliverable[]
  brand_guidelines_url: string | null
  reference_asset_urls: string[]
  specs: Record<string, unknown>
  due_date: string | null
  status: BriefStatus
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type ProductionTask = {
  id: string
  brief_id: string
  organization_id: string
  title: string
  task_type: TaskType
  description: string | null
  assigned_to: string | null
  priority: Priority
  status: TaskStatus
  due_date: string | null
  completed_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type CreativeFile = {
  id: string
  brief_id: string
  task_id: string | null
  uploaded_by: string
  file_url: string
  file_name: string
  file_type: string | null
  file_size: number | null
  version: number
  is_final: boolean
  notes: string | null
  created_at: string
}

// -------------------------------------------------------
// Composite Types
// -------------------------------------------------------

export type BriefWithTasks = CreativeBrief & {
  production_tasks: ProductionTask[]
  creative_files: CreativeFile[]
}

export type TaskWithAssignee = ProductionTask & {
  profiles: {
    full_name: string
    profile_photo_url: string | null
  } | null
  creative_briefs: {
    title: string
    channel_type: string
  }
}
