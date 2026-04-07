'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrgContext, checkPermission } from '@/lib/rbac'

// =============================================================
// Validation Schemas
// =============================================================

const createTaskSchema = z.object({
  brief_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  task_type: z.enum([
    'design',
    'copywriting',
    'voiceover',
    'filming',
    'editing',
    'typesetting',
    'qc',
  ]),
  description: z.string().max(2000).optional().or(z.literal('')),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().optional().or(z.literal('')),
})

const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']).optional(),
  due_date: z.string().optional().or(z.literal('')),
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
// Task CRUD
// =============================================================

export async function createTask(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_production')

  const parsed = createTaskSchema.safeParse({
    brief_id: formData.get('brief_id'),
    title: formData.get('title'),
    task_type: formData.get('task_type'),
    description: formData.get('description') || '',
    assigned_to: formData.get('assigned_to') || '',
    priority: formData.get('priority') || 'medium',
    due_date: formData.get('due_date') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Verify brief belongs to this org
  const { data: brief } = await supabase
    .from('creative_briefs')
    .select('id')
    .eq('id', parsed.data.brief_id)
    .eq('organization_id', orgId)
    .single()

  if (!brief) {
    return { error: { _form: ['Brief not found.'] } }
  }

  const { error } = await supabase.from('production_tasks').insert({
    brief_id: parsed.data.brief_id,
    organization_id: orgId,
    title: parsed.data.title,
    task_type: parsed.data.task_type,
    description: parsed.data.description || null,
    assigned_to: parsed.data.assigned_to || null,
    priority: parsed.data.priority,
    due_date: parsed.data.due_date || null,
    status: 'todo',
  })

  if (error) {
    console.error('Create task failed:', error.message)
    return { error: { _form: ['Failed to create task.'] } }
  }

  revalidatePath('/dashboard/briefs')
  revalidatePath('/dashboard/production')
  return { success: true }
}

export async function updateTask(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_production')

  const parsed = updateTaskSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { id, ...updates } = parsed.data
  const updatePayload: Record<string, unknown> = {}

  if (updates.title) updatePayload.title = updates.title
  if (updates.description !== undefined)
    updatePayload.description = updates.description || null
  if (updates.assigned_to !== undefined)
    updatePayload.assigned_to = updates.assigned_to || null
  if (updates.priority) updatePayload.priority = updates.priority
  if (updates.status) {
    updatePayload.status = updates.status
    if (updates.status === 'done') {
      updatePayload.completed_at = new Date().toISOString()
    } else {
      updatePayload.completed_at = null
    }
  }
  if (updates.due_date !== undefined)
    updatePayload.due_date = updates.due_date || null

  updatePayload.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('production_tasks')
    .update(updatePayload)
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Update task failed:', error.message)
    return { error: { _form: ['Failed to update task.'] } }
  }

  revalidatePath('/dashboard/briefs')
  revalidatePath('/dashboard/production')
  return { success: true }
}

export async function deleteTask(taskId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_production')

  const { error } = await supabase
    .from('production_tasks')
    .delete()
    .eq('id', taskId)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Delete task failed:', error.message)
    return { error: 'Failed to delete task.' }
  }

  revalidatePath('/dashboard/briefs')
  revalidatePath('/dashboard/production')
  return { success: true }
}

export async function getAllTasks(statusFilter?: string) {
  const { supabase, orgId } = await getAuthOrgContext()

  let query = supabase
    .from('production_tasks')
    .select(
      '*, profiles(full_name, profile_photo_url), creative_briefs!inner(title, channel_type)'
    )
    .eq('organization_id', orgId)
    .order('sort_order', { ascending: true })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Get tasks failed:', error.message)
    return []
  }

  return data ?? []
}
