// =============================================================
// Organization & RBAC Type Definitions
// =============================================================

export const ORGANIZATION_TYPES = ['influencer', 'media_house', 'agency'] as const
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number]

export const MEMBER_ROLES = ['owner', 'admin', 'sales', 'production', 'finance', 'member'] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]

export const PERMISSIONS = [
  'manage_organization',
  'manage_members',
  'manage_channels',
  'manage_inventory',
  'create_deals',
  'view_all_orders',
  'manage_production',
  'manage_approvals',
  'manage_billing',
  'view_reports',
] as const
export type Permission = (typeof PERMISSIONS)[number]

/** Which roles grant which permissions */
export const ROLE_PERMISSIONS: Record<MemberRole, readonly Permission[]> = {
  owner: PERMISSIONS, // all permissions
  admin: PERMISSIONS, // all permissions
  sales: [
    'create_deals',
    'view_all_orders',
    'view_reports',
  ],
  production: [
    'view_all_orders',
    'manage_production',
    'manage_approvals',
    'view_reports',
  ],
  finance: [
    'view_all_orders',
    'manage_billing',
    'view_reports',
  ],
  member: [
    'view_all_orders',
  ],
}

// =============================================================
// Database Row Types
// =============================================================

export type Organization = {
  id: string
  name: string
  slug: string
  type: OrganizationType
  logo_url: string | null
  website: string | null
  paystack_subaccount_code: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type OrganizationMember = {
  id: string
  organization_id: string
  user_id: string
  role: MemberRole
  invited_email: string | null
  invited_at: string | null
  accepted_at: string | null
  is_active: boolean
  created_at: string
}

export type OrganizationMemberWithProfile = OrganizationMember & {
  profiles: {
    full_name: string
    username: string
    email: string
    profile_photo_url: string | null
  }
}

// =============================================================
// UI Label Maps (per org type)
// =============================================================

const LABEL_MAP: Record<string, Record<OrganizationType, string>> = {
  packages: {
    influencer: 'Packages',
    media_house: 'Ad Products',
    agency: 'Service Offerings',
  },
  orders: {
    influencer: 'Orders',
    media_house: 'Ad Orders',
    agency: 'Client Orders',
  },
  greeting: {
    influencer: 'your deals',
    media_house: 'your ad orders',
    agency: 'your campaigns',
  },
  publicPageTitle: {
    influencer: 'Book',
    media_house: 'Advertise with',
    agency: 'Work with',
  },
  bookAction: {
    influencer: 'Book Now',
    media_house: 'Reserve Slot',
    agency: 'Get Quote',
  },
}

export function getLabel(key: string, orgType: OrganizationType): string {
  return LABEL_MAP[key]?.[orgType] ?? LABEL_MAP[key]?.influencer ?? key
}
