'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeLog } from '@/lib/utils'

export async function getNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { notifications: [], unreadCount: 0 }

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Failed to fetch notifications:', sanitizeLog(error.message))
    return { notifications: [], unreadCount: 0 }
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

  return { notifications: notifications || [], unreadCount }
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to mark notification as read:', sanitizeLog(error.message))
    return { error: 'Failed to update' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function saveSubscription(subscription: PushSubscriptionJSON) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { endpoint, keys } = subscription as { endpoint: string; keys: { p256dh: string; auth: string } }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'endpoint' })

  if (error) return { error: 'Failed to save subscription' }
  return { success: true }
}

export async function removeSubscription(endpoint: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', user.id)
  return { success: true }
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Failed to mark all notifications as read:', sanitizeLog(error.message))
    return { error: 'Failed to update' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
