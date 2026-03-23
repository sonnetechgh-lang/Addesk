'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ── Shipment creation schema ──
const createShipmentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  carrierName: z.string().min(1, 'Carrier name is required'),
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  trackingUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  shippingCost: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
})

export async function createShipment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const raw = {
    orderId: formData.get('orderId') as string,
    carrierName: formData.get('carrierName') as string,
    trackingNumber: formData.get('trackingNumber') as string,
    trackingUrl: (formData.get('trackingUrl') as string) || '',
    shippingCost: Number(formData.get('shippingCost') || 0),
    notes: (formData.get('notes') as string) || '',
  }

  const parsed = createShipmentSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: 'Invalid fields', details: parsed.error.flatten().fieldErrors }
  }

  const { orderId, carrierName, trackingNumber, trackingUrl, shippingCost, notes } = parsed.data

  // Verify the order belongs to this creator
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, delivery_type')
    .eq('id', orderId)
    .eq('influencer_id', user.id)
    .single()

  if (orderErr || !order) {
    return { error: 'Order not found or access denied' }
  }

  if (order.delivery_type !== 'physical') {
    return { error: 'Shipment tracking is only available for physical delivery orders' }
  }

  // Insert shipment record
  const { error: insertErr } = await supabase
    .from('physical_shipments')
    .insert({
      order_id: orderId,
      carrier_name: carrierName,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl || null,
      shipping_cost: shippingCost ? Math.round(shippingCost * 100) : 0,
      notes: notes || null,
      shipped_at: new Date().toISOString(),
    })

  if (insertErr) {
    console.error('Create shipment error:', insertErr)
    return { error: 'Failed to create shipment record' }
  }

  // Update order shipment status to 'shipped'
  await supabase
    .from('orders')
    .update({ shipment_status: 'shipped' })
    .eq('id', orderId)

  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}

// ── Update shipment status ──
const updateShipmentStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(['pending', 'shipped', 'delivered']),
})

export async function updateShipmentStatus(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const parsed = updateShipmentStatusSchema.safeParse({
    orderId: formData.get('orderId') as string,
    status: formData.get('status') as string,
  })

  if (!parsed.success) {
    return { error: 'Invalid fields' }
  }

  const { orderId, status } = parsed.data

  // Verify ownership
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('influencer_id', user.id)
    .single()

  if (orderErr || !order) {
    return { error: 'Order not found or access denied' }
  }

  const { error } = await supabase
    .from('orders')
    .update({ shipment_status: status })
    .eq('id', orderId)

  if (error) {
    console.error('Update shipment status error:', error)
    return { error: 'Failed to update status' }
  }

  // If marking as delivered, also update the shipment record
  if (status === 'delivered') {
    await supabase
      .from('physical_shipments')
      .update({ delivered_at: new Date().toISOString() })
      .eq('order_id', orderId)
  }

  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}
