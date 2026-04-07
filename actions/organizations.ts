'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { MemberRole } from '@/types/roles'

// =============================================================
// Validation Schemas
// =============================================================

const createOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50)
    .regex(/^[a-z0-9_-]+$/, 'Only lowercase letters, numbers, hyphens, and underscores'),
  type: z.enum(['influencer', 'media_house', 'agency']),
  website: z.string().url().optional().or(z.literal('')),
})

const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
})

const inviteMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'sales', 'production', 'finance', 'member']),
})

// =============================================================
// Helpers
// =============================================================

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

// =============================================================
// Organization CRUD
// =============================================================

export async function createOrganization(formData: FormData) {
  const { supabase, user } = await getAuthUser()

  const parsed = createOrgSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    type: formData.get('type'),
    website: formData.get('website') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Create the organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      type: parsed.data.type,
      website: parsed.data.website || null,
    })
    .select('id')
    .single()

  if (orgError) {
    if (orgError.code === '23505') {
      return { error: { slug: ['This slug is already taken'] } }
    }
    return { error: { _form: ['Failed to create organization'] } }
  }

  // Add the creator as owner
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner' as MemberRole,
      accepted_at: new Date().toISOString(),
    })

  if (memberError) {
    return { error: { _form: ['Organization created but failed to add you as owner'] } }
  }

  // Set as current organization
  await supabase
    .from('profiles')
    .update({ current_organization_id: org.id })
    .eq('id', user.id)

  revalidatePath('/dashboard')
  return { success: true, organizationId: org.id }
}

export async function updateOrganization(orgId: string, formData: FormData) {
  const { supabase } = await getAuthUser()

  const parsed = updateOrgSchema.safeParse({
    name: formData.get('name') || undefined,
    website: formData.get('website') || '',
    slug: formData.get('slug') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.data.name) updates.name = parsed.data.name
  if (parsed.data.slug) updates.slug = parsed.data.slug
  if (parsed.data.website !== undefined) updates.website = parsed.data.website || null

  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId)

  if (error) {
    if (error.code === '23505') {
      return { error: { slug: ['This slug is already taken'] } }
    }
    return { error: { _form: ['Failed to update organization'] } }
  }

  revalidatePath('/dashboard/org/settings')
  return { success: true }
}

// =============================================================
// Organization Logo Upload
// =============================================================

export async function uploadOrgLogo(orgId: string, formData: FormData) {
  const { supabase } = await getAuthUser()

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) {
    return { error: 'No file provided' }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: 'File must be under 2MB' }
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Only JPEG, PNG, and WebP images are allowed' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${orgId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (uploadError) {
    return { error: 'Failed to upload logo' }
  }

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('organizations')
    .update({ logo_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', orgId)

  if (updateError) {
    return { error: 'Logo uploaded but failed to update organization' }
  }

  revalidatePath('/dashboard/org/settings')
  return { success: true, url: urlData.publicUrl }
}

// =============================================================
// Member Management
// =============================================================

export async function inviteMember(orgId: string, formData: FormData) {
  const { supabase, user } = await getAuthUser()

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Check if user already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', parsed.data.email)
    .single()

  if (existingProfile) {
    // User exists — add them directly
    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: existingProfile.id,
        role: parsed.data.role,
        accepted_at: new Date().toISOString(),
      })

    if (error) {
      if (error.code === '23505') {
        return { error: { email: ['This user is already a member'] } }
      }
      return { error: { _form: ['Failed to add member'] } }
    }
  } else {
    // User doesn't exist — create a pending invitation
    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: user.id, // placeholder, will be updated when user signs up
        role: parsed.data.role,
        invited_email: parsed.data.email,
        invited_at: new Date().toISOString(),
      })

    if (error) {
      return { error: { _form: ['Failed to create invitation'] } }
    }
  }

  revalidatePath('/dashboard/org/members')
  return { success: true }
}

export async function updateMemberRole(orgId: string, memberId: string, newRole: MemberRole) {
  const { supabase } = await getAuthUser()

  if (newRole === 'owner') {
    return { error: 'Cannot assign owner role directly' }
  }

  const { error } = await supabase
    .from('organization_members')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('organization_id', orgId)

  if (error) {
    return { error: 'Failed to update role' }
  }

  revalidatePath('/dashboard/org/members')
  return { success: true }
}

export async function removeMember(orgId: string, memberId: string) {
  const { supabase } = await getAuthUser()

  // Prevent removing the last owner
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('id', memberId)
    .single()

  if (member?.role === 'owner') {
    const { count } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('role', 'owner')
      .eq('is_active', true)

    if ((count ?? 0) <= 1) {
      return { error: 'Cannot remove the last owner' }
    }
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId)
    .eq('organization_id', orgId)

  if (error) {
    return { error: 'Failed to remove member' }
  }

  revalidatePath('/dashboard/org/members')
  return { success: true }
}

// =============================================================
// Switch Organization
// =============================================================

export async function switchOrganization(orgId: string) {
  const { supabase, user } = await getAuthUser()

  // Verify the user is a member of the target org
  const { data: membership } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) {
    return { error: 'You are not a member of this organization' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ current_organization_id: orgId })
    .eq('id', user.id)

  if (error) {
    return { error: 'Failed to switch organization' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// =============================================================
// Fetch Helpers (for server components)
// =============================================================

export async function getUserOrganizations() {
  const { supabase, user } = await getAuthUser()

  const { data } = await supabase
    .from('organization_members')
    .select(`
      organization_id,
      role,
      organizations (
        id,
        name,
        slug,
        type,
        logo_url
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  return data ?? []
}

export async function getOrganizationMembers(orgId: string) {
  const { supabase } = await getAuthUser()

  const { data } = await supabase
    .from('organization_members')
    .select(`
      id,
      role,
      is_active,
      invited_email,
      invited_at,
      accepted_at,
      created_at,
      profiles (
        full_name,
        username,
        email,
        profile_photo_url
      )
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  return data ?? []
}
