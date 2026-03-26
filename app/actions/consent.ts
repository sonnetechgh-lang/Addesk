'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { Resend } from 'resend'
import { CURRENT_TERMS_VERSION } from '@/lib/constants'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function acceptInfluencerTerms() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get request metadata
  const headersList = await headers()
  const ip_address = headersList.get('x-forwarded-for') || 'unknown'
  const user_agent = headersList.get('user-agent') || 'unknown'

  // Insert consent log
  const { error: insertError } = await supabase
    .from('consent_logs')
    .insert({
      user_id: user.id,
      email: user.email,
      ip_address,
      user_agent,
      terms_version: CURRENT_TERMS_VERSION,
    })

  if (insertError) {
    console.error('Failed to log consent:', insertError)
    return { success: false, error: 'Failed to record consent' }
  }

  // Fire-and-forget email — don't block the response
  if (user.email && resend) {
    resend.emails.send({
      from: 'AdDesk <no-reply@addesk.io>',
      to: user.email,
      subject: 'Terms of Service Accepted - AdDesk',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Terms of Service Accepted</h2>
          <p>Hi there,</p>
          <p>This email confirms that you accepted the AdDesk Terms of Service (version ${CURRENT_TERMS_VERSION}) on ${new Date().toUTCString()}.</p>
          <p>Your IP: ${ip_address}</p>
          <p>If this wasn't you, please contact support immediately.</p>
          <br/>
          <p>The AdDesk Team</p>
        </div>
      `,
    }).catch((e) => {
      console.error('Failed to send confirmation email', e)
    })
  }

  return { success: true }
}

export async function logClientConsent(influencerId: string, clientEmail: string) {
  const supabase = await createClient()
  
  // Get request metadata
  const headersList = await headers()
  const ip_address = headersList.get('x-forwarded-for') || 'unknown'
  const user_agent = headersList.get('user-agent') || 'unknown'

  const { error: insertError } = await supabase
    .from('client_consent_logs')
    .insert({
      influencer_id: influencerId,
      client_email: clientEmail,
      ip_address,
      user_agent,
      terms_version: CURRENT_TERMS_VERSION,
    })

  if (insertError) {
    console.error('Failed to log client consent:', insertError)
    return { success: false, error: 'Failed to record consent' }
  }

  return { success: true }
}
