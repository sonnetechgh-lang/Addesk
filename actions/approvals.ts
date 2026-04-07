'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrgContext, checkPermission } from '@/lib/rbac'
import { sendApprovalRequestEmail } from '@/lib/email/approval'

// =============================================================
// Validation Schemas
// =============================================================

const createApprovalSchema = z.object({
  brief_id: z.string().uuid(),
  creative_file_id: z.string().uuid().optional().or(z.literal('')),
  client_id: z.string().uuid().optional().or(z.literal('')),
  client_email: z.string().email('Valid email is required'),
  deadline: z.string().optional().or(z.literal('')),
})

// =============================================================
// Helpers
// =============================================================

async function getAuthOrgContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const ctx = await getOrgContext(user.id)
  if (!ctx?.orgId) throw new Error('No organization selected')

  return { supabase, user, orgId: ctx.orgId }
}

// =============================================================
// Approval CRUD
// =============================================================

export async function createApprovalRequest(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_approvals')

  const parsed = createApprovalSchema.safeParse({
    brief_id: formData.get('brief_id'),
    creative_file_id: formData.get('creative_file_id') || '',
    client_id: formData.get('client_id') || '',
    client_email: formData.get('client_email'),
    deadline: formData.get('deadline') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Verify brief belongs to org
  const { data: brief } = await supabase
    .from('creative_briefs')
    .select('id, title')
    .eq('id', parsed.data.brief_id)
    .eq('organization_id', orgId)
    .single()

  if (!brief) {
    return { error: { _form: ['Brief not found.'] } }
  }

  const { data, error } = await supabase
    .from('approval_requests')
    .insert({
      brief_id: parsed.data.brief_id,
      organization_id: orgId,
      creative_file_id: parsed.data.creative_file_id || null,
      client_id: parsed.data.client_id || null,
      client_email: parsed.data.client_email,
      deadline: parsed.data.deadline || null,
      created_by: user.id,
    })
    .select('id, review_token')
    .single()

  if (error) {
    console.error('Create approval failed:', error.message)
    return { error: { _form: ['Failed to create approval request.'] } }
  }

  // Get org name for email
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single()

  // Send email to client
  await sendApprovalRequestEmail({
    toEmail: parsed.data.client_email,
    briefTitle: brief.title,
    orgName: org?.name ?? 'AdDesk',
    reviewToken: data.review_token,
    deadline: parsed.data.deadline || null,
  })

  revalidatePath('/dashboard/approvals')
  revalidatePath('/dashboard/briefs')
  return { success: true, approvalId: data.id }
}

export async function getApprovalRequests(statusFilter?: string) {
  const { supabase, orgId } = await getAuthOrgContext()

  let query = supabase
    .from('approval_requests')
    .select(
      '*, creative_briefs(id, title, channel_type), creative_files(file_name, file_url, file_type, version, is_final), clients(company_name, contact_name), profiles!approval_requests_created_by_fkey(full_name)'
    )
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Get approvals failed:', error.message)
    return []
  }

  return data ?? []
}

export async function getApprovalByToken(token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('approval_requests')
    .select(
      '*, creative_briefs(id, title, channel_type, objective, key_messages), creative_files(file_name, file_url, file_type, version, is_final), organizations(name, logo_url)'
    )
    .eq('review_token', token)
    .single()

  if (error) {
    console.error('Get approval by token failed:', error.message)
    return null
  }

  return data
}

export async function submitClientReview(
  token: string,
  status: 'approved' | 'revision_requested',
  comments: string
) {
  const supabase = await createClient()

  const { data: approval } = await supabase
    .from('approval_requests')
    .select('id, status')
    .eq('review_token', token)
    .single()

  if (!approval) {
    return { error: 'Review not found.' }
  }

  if (approval.status !== 'pending') {
    return { error: 'This review has already been submitted.' }
  }

  const { error } = await supabase
    .from('approval_requests')
    .update({
      status,
      comments: comments || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', approval.id)

  if (error) {
    console.error('Submit review failed:', error.message)
    return { error: 'Failed to submit review.' }
  }

  return { success: true }
}

export async function deleteApprovalRequest(approvalId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_approvals')

  const { error } = await supabase
    .from('approval_requests')
    .delete()
    .eq('id', approvalId)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Delete approval failed:', error.message)
    return { error: 'Failed to delete approval request.' }
  }

  revalidatePath('/dashboard/approvals')
  return { success: true }
}

export async function resendApprovalEmail(approvalId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_approvals')

  const { data } = await supabase
    .from('approval_requests')
    .select(
      'review_token, client_email, deadline, creative_briefs(title), organizations(name)'
    )
    .eq('id', approvalId)
    .eq('organization_id', orgId)
    .single()

  if (!data) {
    return { error: 'Approval not found.' }
  }

  await sendApprovalRequestEmail({
    toEmail: data.client_email,
    briefTitle: (data.creative_briefs as unknown as { title: string })?.title ?? 'Creative Review',
    orgName: (data.organizations as unknown as { name: string })?.name ?? 'AdDesk',
    reviewToken: data.review_token,
    deadline: data.deadline,
  })

  return { success: true }
}
