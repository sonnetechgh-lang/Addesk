'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCompletionEmail } from '@/lib/email/resend'
import { revalidatePath } from 'next/cache'
import { sanitizeLog } from '@/lib/utils'

const PUSH_SEND_URL = new URL('/api/push/send', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').toString()

const VALID_TRANSITIONS: Record<string, string[]> = {
  new: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  submitted: ['completed', 'cancelled'],
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Fetch the current order (RLS ensures only the influencer's own orders)
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*, packages(title)')
    .eq('id', orderId)
    .eq('influencer_id', user.id)
    .single()

  if (fetchError || !order) {
    return { error: 'Order not found' }
  }

  // Validate the transition
  const allowed = VALID_TRANSITIONS[order.order_status]
  if (!allowed || !allowed.includes(newStatus)) {
    return { error: `Cannot transition from "${order.order_status}" to "${newStatus}"` }
  }

  // Perform the update
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      order_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (updateError) {
    console.error('Failed to update order status:', sanitizeLog(updateError.message))
    return { error: 'Failed to update order status' }
  }

  // Create in-app notification for the influencer about the status change
  const statusLabels: Record<string, string> = {
    in_progress: 'is now in progress',
    completed: 'has been completed',
    cancelled: 'has been cancelled',
  }
  const statusLabel = statusLabels[newStatus] || `was updated to ${newStatus}`
  const packageTitle = (order as any).packages?.title || 'Service order'
  await supabase
    .from('notifications')
    .insert({
      user_id: user.id,
      type: newStatus === 'completed' ? 'order_completed' : newStatus === 'cancelled' ? 'order_cancelled' : 'system',
      title: `Order ${newStatus === 'completed' ? 'Completed' : newStatus === 'cancelled' ? 'Cancelled' : 'Updated'}`,
      message: `"${packageTitle}" for ${order.client_name} ${statusLabel}.`,
      link: `/dashboard/orders/${orderId}`,
    })

  // Send push notification for the status change
  await fetch(PUSH_SEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      title: `Order ${newStatus === 'completed' ? 'Completed ✅' : newStatus === 'cancelled' ? 'Cancelled' : 'Updated'}`,
      body: `"${packageTitle}" for ${order.client_name} ${statusLabel}.`,
      url: `/dashboard/orders/${orderId}`,
    }),
  }).catch(() => { /* non-critical */ })

  // If marked as completed, send thank-you email to client
  if (newStatus === 'completed') {
    // Fetch the influencer's profile name for the email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const influencerName = profile?.full_name || 'Your creator'
    const packageTitle = (order as any).packages?.title || 'Service Package'

    await sendCompletionEmail(
      order.client_email,
      order.client_name,
      influencerName,
      packageTitle,
      order.amount
    )
  }

  // Revalidate the dashboard and orders pages so they reflect the new status
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)

  return { success: true, newStatus }
}
