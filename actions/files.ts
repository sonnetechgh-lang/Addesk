'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getOrgContext, checkPermission } from '@/lib/rbac'

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
// File Operations
// =============================================================

export async function uploadCreativeFile(formData: FormData) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_production')

  const file = formData.get('file') as File | null
  const briefId = formData.get('brief_id') as string
  const taskId = (formData.get('task_id') as string) || null
  const notes = (formData.get('notes') as string) || null

  if (!file || !briefId) {
    return { error: 'File and brief ID are required.' }
  }

  // Verify brief belongs to org
  const { data: brief } = await supabase
    .from('creative_briefs')
    .select('id')
    .eq('id', briefId)
    .eq('organization_id', orgId)
    .single()

  if (!brief) {
    return { error: 'Brief not found.' }
  }

  // Determine next version number
  const { data: existingFiles } = await supabase
    .from('creative_files')
    .select('version')
    .eq('brief_id', briefId)
    .eq('file_name', file.name)
    .order('version', { ascending: false })
    .limit(1)

  const nextVersion = existingFiles && existingFiles.length > 0
    ? existingFiles[0].version + 1
    : 1

  // Upload to Supabase storage
  const filePath = `${orgId}/${briefId}/${Date.now()}_${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('creatives')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('File upload failed:', uploadError.message)
    return { error: 'Failed to upload file.' }
  }

  const { data: urlData } = supabase.storage
    .from('creatives')
    .getPublicUrl(filePath)

  // Create DB record
  const { error: dbError } = await supabase.from('creative_files').insert({
    brief_id: briefId,
    task_id: taskId,
    uploaded_by: user.id,
    file_url: urlData.publicUrl,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    version: nextVersion,
    notes,
  })

  if (dbError) {
    console.error('File record creation failed:', dbError.message)
    return { error: 'Failed to save file record.' }
  }

  revalidatePath('/dashboard/briefs')
  return { success: true }
}

export async function deleteFile(fileId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_production')

  // Get file details to delete from storage
  const { data: file } = await supabase
    .from('creative_files')
    .select('*, creative_briefs!inner(organization_id)')
    .eq('id', fileId)
    .single()

  if (!file || (file.creative_briefs as unknown as { organization_id: string }).organization_id !== orgId) {
    return { error: 'File not found.' }
  }

  // Extract path from URL for storage deletion
  const url = new URL(file.file_url)
  const pathParts = url.pathname.split('/storage/v1/object/public/creatives/')
  if (pathParts.length > 1) {
    await supabase.storage.from('creatives').remove([pathParts[1]])
  }

  const { error } = await supabase
    .from('creative_files')
    .delete()
    .eq('id', fileId)

  if (error) {
    console.error('Delete file failed:', error.message)
    return { error: 'Failed to delete file.' }
  }

  revalidatePath('/dashboard/briefs')
  return { success: true }
}

export async function markFileAsFinal(fileId: string) {
  const { supabase, user, orgId } = await getAuthOrgContext()
  await checkPermission(user.id, orgId, 'manage_production')

  // Verify file belongs to org
  const { data: file } = await supabase
    .from('creative_files')
    .select('brief_id, creative_briefs!inner(organization_id)')
    .eq('id', fileId)
    .single()

  if (!file || (file.creative_briefs as unknown as { organization_id: string }).organization_id !== orgId) {
    return { error: 'File not found.' }
  }

  // Unmark any existing final files for this brief
  await supabase
    .from('creative_files')
    .update({ is_final: false })
    .eq('brief_id', file.brief_id)
    .eq('is_final', true)

  // Mark this file as final
  const { error } = await supabase
    .from('creative_files')
    .update({ is_final: true })
    .eq('id', fileId)

  if (error) {
    console.error('Mark final failed:', error.message)
    return { error: 'Failed to mark file as final.' }
  }

  revalidatePath('/dashboard/briefs')
  return { success: true }
}

export async function getFilesForBrief(briefId: string) {
  const { supabase } = await getAuthOrgContext()

  const { data, error } = await supabase
    .from('creative_files')
    .select('*, profiles(full_name, profile_photo_url)')
    .eq('brief_id', briefId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get files failed:', error.message)
    return []
  }

  return data ?? []
}
