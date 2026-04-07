// =============================================================
// Channel & Ad Slot Type Definitions
// =============================================================

export const CHANNEL_TYPES = [
  'influencer',
  'print',
  'digital',
  'broadcast_tv',
  'broadcast_radio',
] as const
export type ChannelType = (typeof CHANNEL_TYPES)[number]

export const SLOT_TYPES = [
  'print_page',
  'broadcast_spot',
  'digital_placement',
  'social_post',
] as const
export type SlotType = (typeof SLOT_TYPES)[number]

/** Map channel types to their valid slot types */
export const CHANNEL_SLOT_MAP: Record<ChannelType, SlotType> = {
  influencer: 'social_post',
  print: 'print_page',
  digital: 'digital_placement',
  broadcast_tv: 'broadcast_spot',
  broadcast_radio: 'broadcast_spot',
}

// =============================================================
// Channel-Specific Specs (discriminated union)
// =============================================================

export type PrintSpecs = {
  type: 'print'
  pageSize: 'full' | 'half' | 'quarter' | 'eighth' | 'custom'
  width_mm?: number
  height_mm?: number
  bleed_mm?: number
  colorMode: 'full_color' | 'spot_color' | 'bw'
  section: string
  position: 'run_of_paper' | 'preferred' | 'guaranteed'
}

export type BroadcastSpecs = {
  type: 'broadcast_tv' | 'broadcast_radio'
  duration_seconds: 15 | 30 | 45 | 60 | 90 | 120
  daypart: 'morning' | 'midday' | 'afternoon' | 'prime_time' | 'late_night'
  program?: string
  format: 'live_read' | 'pre_recorded' | 'sponsorship'
}

export type DigitalSpecs = {
  type: 'digital'
  placement: 'banner' | 'sidebar' | 'interstitial' | 'native' | 'video_pre_roll'
  width_px: number
  height_px: number
  file_types: string[]
  max_file_size_mb: number
  pricing_model: 'flat' | 'cpm' | 'cpc'
}

export type InfluencerSpecs = {
  type: 'influencer'
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter'
  content_type: 'post' | 'story' | 'reel' | 'video' | 'thread'
  includes_usage_rights: boolean
}

export type ChannelSpecs =
  | PrintSpecs
  | BroadcastSpecs
  | DigitalSpecs
  | InfluencerSpecs

// =============================================================
// Database Row Types
// =============================================================

export type Channel = {
  id: string
  organization_id: string
  type: ChannelType
  name: string
  description: string | null
  specs: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AdSlot = {
  id: string
  channel_id: string
  organization_id: string
  name: string
  slot_type: SlotType
  specs: Record<string, unknown>
  base_price: number // pesewas
  currency: string
  availability_schedule: Record<string, unknown>
  max_units_per_period: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RateCard = {
  id: string
  ad_slot_id: string
  name: string
  price: number // pesewas
  valid_from: string | null
  valid_to: string | null
  conditions: Record<string, unknown>
  is_default: boolean
  created_at: string
}

export type AdSlotWithRateCards = AdSlot & {
  rate_cards: RateCard[]
}

export type ChannelWithSlots = Channel & {
  ad_slots: AdSlot[]
}

// =============================================================
// UI Labels
// =============================================================

export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  influencer: 'Influencer / Creator',
  print: 'Print Media',
  digital: 'Digital',
  broadcast_tv: 'TV Broadcast',
  broadcast_radio: 'Radio Broadcast',
}

export const SLOT_TYPE_LABELS: Record<SlotType, string> = {
  print_page: 'Print Page',
  broadcast_spot: 'Broadcast Spot',
  digital_placement: 'Digital Placement',
  social_post: 'Social Media Post',
}

export const DAYPART_LABELS: Record<string, string> = {
  morning: 'Morning (6am–12pm)',
  midday: 'Midday (12pm–2pm)',
  afternoon: 'Afternoon (2pm–6pm)',
  prime_time: 'Prime Time (6pm–10pm)',
  late_night: 'Late Night (10pm–6am)',
}

export const PAGE_SIZE_LABELS: Record<string, string> = {
  full: 'Full Page',
  half: 'Half Page',
  quarter: 'Quarter Page',
  eighth: 'Eighth Page',
  custom: 'Custom Size',
}

export const COLOR_MODE_LABELS: Record<string, string> = {
  full_color: 'Full Color',
  spot_color: 'Spot Color',
  bw: 'Black & White',
}

export const POSITION_LABELS: Record<string, string> = {
  run_of_paper: 'Run of Paper',
  preferred: 'Preferred Position',
  guaranteed: 'Guaranteed Position',
}
