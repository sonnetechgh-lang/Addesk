'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  instagramHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  twitterHandle: z.string().optional(),
})

export async function updateProfileSettings(formData: FormData) {
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
    console.error('Update settings profile error:', error)
    return { error: 'Failed to update profile' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

const payoutSchema = z.object({
  bankCode: z.string().min(3, 'Bank code is required'),
  accountNumber: z.string().min(10, 'Account number is too short'),
  accountName: z.string().min(2, 'Account name is required'),
})

export async function updatePayoutSettings(values: z.infer<typeof payoutSchema>) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('paystack_subaccount_code')
    .eq('id', user.id)
    .single()

  try {
    const isNew = !profile?.paystack_subaccount_code
    const url = isNew 
      ? 'https://api.paystack.co/subaccount' 
      : `https://api.paystack.co/subaccount/${profile.paystack_subaccount_code}`
    
    const method = isNew ? 'POST' : 'PUT'

    // 1. Create or Update Subaccount on Paystack
    const paystackRes = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_name: values.accountName,
        settlement_bank: values.bankCode,
        account_number: values.accountNumber,
        ...(isNew && { 
          percentage_charge: Number(process.env.PLATFORM_PERCENTAGE_CHARGE) || 6,
          description: `Subaccount for Influencer ${user.id}`
        })
      }),
    })

    const paystackData = await paystackRes.json()

    if (!paystackRes.ok || !paystackData.status) {
      console.error('Paystack subaccount error:', paystackData)
      return { error: 'Failed to update payment account. Please check your bank details and try again.' }
    }

    // 2. If it was a new subaccount, we MUST save the code to the DB
    if (isNew) {
      const subaccountCode = paystackData.data.subaccount_code
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          paystack_subaccount_code: subaccountCode,
          is_onboarded: true, // Mark them as fully onboarded if they weren't
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Database subaccount update error:', updateError)
        return { error: 'Paystack account created, but failed to update local profile. Please contact support.' }
      }
    }
    
    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (err: any) {
    console.error('Payout update unexpected error:', err)
    return { error: 'Internal server error' }
  }
}

export async function uploadProfilePhoto(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const file = formData.get('photo') as File
  if (!file || file.size === 0) {
    return { error: 'No file provided' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'File must be a JPEG, PNG, WebP, or GIF image' }
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { error: 'File must be smaller than 2MB' }
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const filePath = `${user.id}/avatar.${ext}`

  // Upload to Supabase Storage (upsert to overwrite previous avatar)
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Avatar upload error:', uploadError)
    return { error: 'Failed to upload image' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Update profile with new photo URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ profile_photo_url: publicUrl })
    .eq('id', user.id)

  if (updateError) {
    console.error('Profile photo URL update error:', updateError)
    return { error: 'Image uploaded but failed to update profile' }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true, url: publicUrl }
}

export async function deleteProfilePhoto() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get current profile photo URL to determine the storage path
  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_photo_url')
    .eq('id', user.id)
    .single()

  if (!profile?.profile_photo_url) {
    return { error: 'No profile photo to delete' }
  }

  // Remove all possible avatar files for this user from storage
  const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  const filesToDelete = extensions.map(ext => `${user.id}/avatar.${ext}`)

  await supabase.storage
    .from('avatars')
    .remove(filesToDelete)

  // Clear the profile photo URL in the database
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ profile_photo_url: null })
    .eq('id', user.id)

  if (updateError) {
    console.error('Profile photo URL clear error:', updateError)
    return { error: 'Failed to remove profile photo' }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}
