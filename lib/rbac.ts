import { createClient } from '@/lib/supabase/server'
import type { MemberRole, Permission } from '@/types/roles'
import { ROLE_PERMISSIONS } from '@/types/roles'

/**
 * Get the user's role within a specific organization.
 * Returns null if the user is not an active member.
 */
export async function getUserRole(
  userId: string,
  organizationId: string
): Promise<MemberRole | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single()

  return (data?.role as MemberRole) ?? null
}

/**
 * Check whether a user has a specific permission within an organization.
 * Throws an error if the user lacks the permission (use in server actions).
 */
export async function checkPermission(
  userId: string,
  organizationId: string,
  permission: Permission
): Promise<void> {
  const role = await getUserRole(userId, organizationId)

  if (!role) {
    throw new Error('Not a member of this organization')
  }

  const allowed = ROLE_PERMISSIONS[role]
  if (!allowed.includes(permission)) {
    throw new Error(`Insufficient permissions: requires ${permission}`)
  }
}

/**
 * Check whether a user has a specific permission (non-throwing).
 * Returns true/false — use in components for conditional rendering.
 */
export async function hasPermission(
  userId: string,
  organizationId: string,
  permission: Permission
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

/**
 * Check whether a user has one of the specified roles.
 */
export async function hasRole(
  userId: string,
  organizationId: string,
  roles: MemberRole[]
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  if (!role) return false
  return roles.includes(role)
}

/**
 * Get the user's current organization context from their profile.
 * Returns { orgId, role } or null if no org is set.
 */
export async function getOrgContext(userId: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_organization_id')
    .eq('id', userId)
    .single()

  if (!profile?.current_organization_id) return null

  const role = await getUserRole(userId, profile.current_organization_id)

  return {
    orgId: profile.current_organization_id as string,
    role,
  }
}
