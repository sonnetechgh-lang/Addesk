import { Resend } from 'resend'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

type ApprovalEmailParams = {
  toEmail: string
  briefTitle: string
  orgName: string
  reviewToken: string
  deadline: string | null
}

export async function sendApprovalRequestEmail({
  toEmail,
  briefTitle,
  orgName,
  reviewToken,
  deadline,
}: ApprovalEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Skipping approval email.')
    return { success: false, error: 'API key missing' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addesk.com'
  const fromAddress =
    process.env.EMAIL_FROM_ADDRESS ||
    'AdDesk <bookings@updates.addesk.com>'

  const safeTitle = escapeHtml(briefTitle)
  const safeOrg = escapeHtml(orgName)
  const reviewUrl = `${appUrl}/review/${reviewToken}`

  const deadlineText = deadline
    ? `<p style="margin: 4px 0;"><strong>Review by:</strong> ${new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>`
    : ''

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; color: #333;">
      <h2 style="color: #000;">Creative Review Request</h2>
      <p>Hi,</p>
      <p><strong>${safeOrg}</strong> has shared a creative for your review and approval.</p>
      
      <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Brief: ${safeTitle}</h3>
        ${deadlineText}
      </div>
      
      <p>Please click the button below to review the creative and provide your feedback.</p>
      
      <a href="${reviewUrl}" style="display: inline-block; background-color: #059669; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 10px;">
        Review Creative
      </a>
      
      <p style="margin-top: 24px; color: #999; font-size: 12px;">
        You can also review at: ${reviewUrl}
      </p>
      
      <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 16px;">
        This email was sent by ${safeOrg} via AdDesk. If you did not expect this, you can safely ignore it.
      </p>
    </div>
  `

  try {
    const data = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `Creative Review: ${safeTitle} — ${safeOrg}`,
      html: htmlContent,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send approval email:', error)
    return { success: false, error }
  }
}
