import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNewBookingEmail } from '@/lib/email/resend'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ''

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Paystack Signature
    const signature = req.headers.get('x-paystack-signature')
    
    if (!signature) {
      console.error('Missing Paystack signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }
    
    // We need the raw body as a string to verify the HMAC signature
    const textBody = await req.text()
    
    if (!textBody) {
      console.error('Empty request body')
      return NextResponse.json({ error: 'Empty body' }, { status: 400 })
    }
    
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET)
      .update(textBody)
      .digest('hex')

    if (hash !== signature) {
      console.error('Invalid Paystack Signature')
      console.error('Expected hash:', hash)
      console.error('Received signature:', signature)
      console.error('Request body:', textBody.substring(0, 500))
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 2. Parse Validated Payload
    const event = JSON.parse(textBody)
    
    // We only care about successful charges
    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true })
    }

    const { data } = event
    console.log('Webhook event data:', JSON.stringify(data, null, 2))
    
    const metadata = data.metadata || {}
    const customFields = metadata.custom_fields || []
    
    console.log('Metadata:', metadata)
    console.log('Custom fields:', customFields)
    
    // Extract our custom fields defined in the checkout frontend
    const getField = (variableName: string) => {
      const field = customFields.find((f: { variable_name: string; value: string }) => f.variable_name === variableName)
      return field ? field.value : null
    }

    const influencerId = getField('influencer_id')
    const packageId = getField('package_id')
    const clientName = getField('client_name')
    const brief = getField('brief')

    // Parse brief image URLs (stored as JSON string in metadata)
    let briefImageUrls: string[] = []
    try {
      const rawImageUrls = getField('brief_image_urls')
      if (rawImageUrls) briefImageUrls = JSON.parse(rawImageUrls)
    } catch { /* ignore parse errors, default to empty array */ }

    // Extract delivery fields
    const deliveryType = getField('delivery_type') || 'digital'
    let deliveryAddress = null
    try {
      const rawAddr = getField('delivery_address')
      if (rawAddr) deliveryAddress = JSON.parse(rawAddr)
    } catch { /* ignore parse errors */ }
    const onPremiseDate = getField('on_premise_date') || null
    const onPremiseLocation = getField('on_premise_location') || null

    console.log('Extracted values:', { influencerId, packageId, clientName, brief })

    if (!influencerId || !packageId || !clientName) {
      console.error('Webhook missing required explicit metadata', customFields)
      return NextResponse.json({ error: 'Missing metadata', received: { influencerId, packageId, clientName } }, { status: 400 })
    }

    // Validate that influencerId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(influencerId)) {
      console.error('Invalid influencer_id format:', influencerId)
      return NextResponse.json({ error: 'Invalid influencer_id format' }, { status: 400 })
    }
    
    if (!uuidRegex.test(packageId)) {
      console.error('Invalid package_id format:', packageId)
      return NextResponse.json({ error: 'Invalid package_id format' }, { status: 400 })
    }

    // 3. Save Order using Admin Client (Bypass RLS)
    let supabaseAdmin;
    try {
      supabaseAdmin = createAdminClient()
    } catch (envError) {
      console.error('CRITICAL: Failed to create admin Supabase client. Is SUPABASE_SERVICE_ROLE_KEY set?', envError instanceof Error ? envError.message : envError)
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    
    // Verify package exists
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .select('id, influencer_id')
      .eq('id', packageId)
      .single()

    if (pkgError || !pkg) {
      console.error('Package not found:', packageId, pkgError)
      return NextResponse.json({ error: 'Package not found' }, { status: 400 })
    }

    // Verify the package belongs to the influencer
    if (pkg.influencer_id !== influencerId) {
      console.error('Package does not belong to influencer:', { packageInfluencer: pkg.influencer_id, metadataInfluencer: influencerId })
      return NextResponse.json({ error: 'Package influencer mismatch' }, { status: 400 })
    }
    
    // Check if order already exists (idempotency check)
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('paystack_reference', data.reference)
      .single()

    if (existingOrder) {
      console.log(`Order with reference ${data.reference} already exists. Skipping.`)
      return NextResponse.json({ received: true, orderId: existingOrder.id, message: 'Order already exists' })
    }

    // Paystack splits the money automatically. We calculate the platform fee simply to record it.
    const amountInPesos = data.amount as number
    const platformFee = Math.round(amountInPesos * 0.06)
    const influencerAmount = amountInPesos - platformFee

    const { data: newOrder, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert({
        reference: data.reference,
        paystack_reference: data.reference,
        package_id: packageId,
        influencer_id: influencerId,
        client_name: clientName,
        client_business_name: clientName, 
        client_email: data.customer.email,
        product_description: brief || 'No brief provided', 
        amount: amountInPesos,
        platform_fee: platformFee,
        influencer_amount: influencerAmount,
        payment_status: 'paid',
        order_status: 'new',
        brief_image_urls: briefImageUrls,
        delivery_type: deliveryType,
        delivery_address: deliveryAddress,
        on_premise_date: onPremiseDate,
        on_premise_location: onPremiseLocation,
        shipment_status: deliveryType === 'physical' ? 'pending' : 'not_applicable',
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Failed to insert order from Webhook:', insertError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log(`Order ${newOrder.id} successfully created via webhook!`)

    // 4a. Create in-app notification for the influencer
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: influencerId,
        type: 'new_order',
        title: 'New Booking!',
        message: `${clientName} just booked your service. Tap to view the order details.`,
        link: `/dashboard/orders/${newOrder.id}`,
      })
    
    // 4b. Trigger Email Notification to Influencer
    // First, fetch the influencer's email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', influencerId)
      .single()

    if (profile && profile.email) {
      await sendNewBookingEmail(
        profile.email,
        profile.full_name,
        clientName,
        amountInPesos,
        brief,
        newOrder.id
      )
      console.log(`Notification email sent to ${profile.email}`)
    } else {
      console.warn(`Could not send email. Profile ${influencerId} not found or missing email.`)
    }
    
    return NextResponse.json({ received: true, orderId: newOrder.id })
    
  } catch (err) {
    console.error('Webhook Error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
