// =============================================================
// Campaign, Line Item, Client & Activity Type Definitions
// =============================================================

// -------------------------------------------------------
// Client (CRM)
// -------------------------------------------------------

export const CREDIT_TERMS = ['prepaid', 'net_15', 'net_30', 'net_60'] as const
export type CreditTerm = (typeof CREDIT_TERMS)[number]

export const CREDIT_TERM_LABELS: Record<CreditTerm, string> = {
  prepaid: 'Prepaid',
  net_15: 'Net 15 days',
  net_30: 'Net 30 days',
  net_60: 'Net 60 days',
}

export type BillingAddress = {
  line1?: string
  line2?: string
  city?: string
  region?: string
  country?: string
}

export type Client = {
  id: string
  organization_id: string
  user_id: string | null
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  billing_address: BillingAddress
  credit_terms: CreditTerm
  notes: string | null
  created_at: string
  updated_at: string
}

// -------------------------------------------------------
// Campaign
// -------------------------------------------------------

export const CAMPAIGN_STATUSES = [
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled',
] as const
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  active: 'bg-emerald-50 text-emerald-700',
  paused: 'bg-amber-50 text-amber-700',
  completed: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-600',
}

export type Campaign = {
  id: string
  organization_id: string
  client_id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  total_budget: number | null // pesewas
  status: CampaignStatus
  created_by: string
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export type CampaignWithClient = Campaign & {
  clients: Pick<Client, 'id' | 'company_name' | 'contact_name'>
}

// -------------------------------------------------------
// Line Items
// -------------------------------------------------------

export const LINE_ITEM_STATUSES = [
  'pending',
  'confirmed',
  'in_production',
  'scheduled',
  'live',
  'completed',
  'cancelled',
] as const
export type LineItemStatus = (typeof LINE_ITEM_STATUSES)[number]

export const LINE_ITEM_STATUS_LABELS: Record<LineItemStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_production: 'In Production',
  scheduled: 'Scheduled',
  live: 'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const LINE_ITEM_STATUS_COLORS: Record<LineItemStatus, string> = {
  pending: 'bg-zinc-100 text-zinc-600',
  confirmed: 'bg-blue-50 text-blue-700',
  in_production: 'bg-purple-50 text-purple-700',
  scheduled: 'bg-indigo-50 text-indigo-700',
  live: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}

export type LineItem = {
  id: string
  campaign_id: string
  order_id: string | null
  ad_slot_id: string | null
  channel_id: string
  description: string
  quantity: number
  unit_price: number // pesewas
  total_price: number // pesewas
  start_date: string | null
  end_date: string | null
  status: LineItemStatus
  created_at: string
  updated_at: string
}

export type LineItemWithChannel = LineItem & {
  channels: { name: string; type: string }
}

// -------------------------------------------------------
// Activity Log
// -------------------------------------------------------

export const ENTITY_TYPES = [
  'client',
  'campaign',
  'line_item',
  'channel',
  'ad_slot',
  'invoice',
  'brief',
  'approval',
  'schedule',
] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

export const ACTION_TYPES = [
  'created',
  'updated',
  'deleted',
  'status_changed',
  'assigned',
  'commented',
] as const
export type ActionType = (typeof ACTION_TYPES)[number]

export type ActivityLogEntry = {
  id: string
  organization_id: string
  entity_type: EntityType
  entity_id: string
  action: ActionType
  actor_id: string | null
  details: Record<string, unknown>
  created_at: string
}

export type ActivityLogEntryWithActor = ActivityLogEntry & {
  profiles: {
    full_name: string
    profile_photo_url: string | null
  } | null
}
