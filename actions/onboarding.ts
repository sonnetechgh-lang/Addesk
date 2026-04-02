'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sanitizeLog } from '@/lib/utils'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  instagramHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  twitterHandle: z.string().optional(),
})

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const rawData = {
    fullName: formData.get('fullName') as string,
    username: formData.get('username') as string,
    bio: formData.get('bio') as string,
    instagramHandle: formData.get('instagramHandle') as string,
    tiktokHandle: formData.get('tiktokHandle') as string,
    twitterHandle: formData.get('twitterHandle') as string,
  }

  const validatedFields = profileSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: 'Invalid fields', details: validatedFields.error.flatten().fieldErrors }
  }

  const { fullName, username, bio, instagramHandle, tiktokHandle, twitterHandle } = validatedFields.data

  // Check username uniqueness
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .single()

  if (existingUser) {
    return { error: 'Username is already taken' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      username: username,
      bio: bio,
      instagram_handle: instagramHandle,
      tiktok_handle: tiktokHandle,
      twitter_handle: twitterHandle,
    })
    .eq('id', user.id)

  if (error) {
    console.error('Update profile error:', sanitizeLog(error.message))
    return { error: 'Failed to update profile' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

const packageSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  priceGHS: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, 'Price must be at least 1 GHS'),
  deliveryDays: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1, 'Delivery time must be at least 1 day'),
})

export async function createPackage(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    priceGHS: formData.get('priceGHS'),
    deliveryDays: formData.get('deliveryDays'),
  }

  const validatedFields = packageSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: 'Invalid fields', details: validatedFields.error.flatten().fieldErrors }
  }

  const { title, description, priceGHS, deliveryDays } = validatedFields.data
  
  // Read delivery flags
  const requiresPhysicalDelivery = formData.get('requiresPhysicalDelivery') === 'true'
  const requiresOnPremise = formData.get('requiresOnPremise') === 'true'
  
  // Convert GHS to pesewas for DB storage
  const pricePesewas = Math.round(Number(priceGHS) * 100)

  // Enforce package limit per creator (#15)
  const { count } = await supabase
    .from('packages')
    .select('*', { count: 'exact', head: true })
    .eq('influencer_id', user.id)

  if ((count ?? 0) >= 20) {
    return { error: 'You can have a maximum of 20 packages. Please delete an existing one first.' }
  }

  const { error } = await supabase
    .from('packages')
    .insert({
      influencer_id: user.id,
      title,
      description,
      price: pricePesewas,
      delivery_days: deliveryDays,
      is_active: true,
      requires_physical_delivery: requiresPhysicalDelivery,
      requires_on_premise: requiresOnPremise,
    })

  if (error) {
    console.error('Create package error:', sanitizeLog(error.message))
    return { error: 'Failed to create package' }
  }

  revalidatePath('/dashboard/packages')
  return { success: true }
}
