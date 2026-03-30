import { Resend } from 'resend'

/** Escape HTML special characters to prevent XSS in email templates */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Helper to send a clean transactional email to the Influencer when a new booking arrives
export async function sendNewBookingEmail(
  toEmail: string, 
  influencerName: string, 
  clientName: string, 
  amountPesewas: number, 
  brief: string,
  orderId: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Skipping email.")
    return { success: false, error: 'API key missing' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const amountGHS = (amountPesewas / 100).toFixed(2)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addesk.com'
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'AdDesk Bookings <bookings@updates.addesk.com>'

  const safeInfluencer = escapeHtml(influencerName)
  const safeClient = escapeHtml(clientName)
  const safeBrief = escapeHtml(brief || 'No brief provided')

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; color: #333;">
      <h2 style="color: #000;">New Booking Received! 🎉</h2>
      <p>Hi ${safeInfluencer},</p>
      <p>Great news! <strong>${safeClient}</strong> just booked a package with you for <strong>GHS ${amountGHS}</strong>.</p>
      
      <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Campaign Brief:</h3>
        <p style="white-space: pre-wrap; margin-bottom: 0;">${safeBrief}</p>
      </div>
      
      <p>Please log in to your AdDesk dashboard to review the full details and upload the deliverables when ready.</p>
      
      <a href="${appUrl}/dashboard/orders/${orderId}" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 10px;">
        View Order in Dashboard
      </a>
    </div>
  `

  try {
    const data = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `New Booking Request from ${safeClient}`,
      html: htmlContent,
    })

    return { success: true, data }
  } catch (error) {
    console.error("Failed to send Resend email:", error)
    return { success: false, error }
  }
}

// Send a thank-you email to the client when the influencer marks an order as completed
export async function sendCompletionEmail(
  clientEmail: string,
  clientName: string,
  influencerName: string,
  packageTitle: string,
  amountPesewas: number
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Skipping completion email.")
    return { success: false, error: 'API key missing' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const amountGHS = (amountPesewas / 100).toFixed(2)
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'AdDesk <bookings@updates.addesk.com>'

  const safeClient = escapeHtml(clientName)
  const safeInfluencer = escapeHtml(influencerName)
  const safePackage = escapeHtml(packageTitle)

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; color: #333;">
      <h2 style="color: #000;">Your Ad Has Been Delivered! 🎉</h2>
      <p>Hi ${safeClient},</p>
      <p>Great news — <strong>${safeInfluencer}</strong> has completed your campaign order.</p>
      
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <h3 style="margin-top: 0; color: #166534;">Delivery Summary</h3>
        <p style="margin: 4px 0;"><strong>Package:</strong> ${safePackage}</p>
        <p style="margin: 4px 0;"><strong>Amount Paid:</strong> GHS ${amountGHS}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> ✅ Completed</p>
      </div>
      
      <p>Thank you for choosing AdDesk to connect with top creators. If you have any questions about your deliverables, feel free to reach out directly to the creator.</p>
      
      <p style="color: #999; font-size: 12px; margin-top: 30px;">— The AdDesk Team</p>
    </div>
  `

  try {
    const data = await resend.emails.send({
      from: fromAddress,
      to: [clientEmail],
      subject: `Your Ad with ${safeInfluencer} is Complete! 🎉`,
      html: htmlContent,
    })

    console.log('Completion email sent successfully')
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send completion email:", error)
    return { success: false, error }
  }
}
