import { Resend } from 'resend'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

type InvoiceEmailParams = {
  toEmail: string
  clientName: string
  orgName: string
  invoiceNumber: string
  totalPesewas: number
  dueDate: string | null
  viewToken: string
}

export async function sendInvoiceEmail({
  toEmail,
  clientName,
  orgName,
  invoiceNumber,
  totalPesewas,
  dueDate,
  viewToken,
}: InvoiceEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Skipping invoice email.')
    return { success: false, error: 'API key missing' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addesk.com'
  const fromAddress =
    process.env.EMAIL_FROM_ADDRESS ||
    'AdDesk <bookings@updates.addesk.com>'

  const safeClient = escapeHtml(clientName)
  const safeOrg = escapeHtml(orgName)
  const safeInvNum = escapeHtml(invoiceNumber)
  const viewUrl = `${appUrl}/invoice/${viewToken}`

  const formattedTotal = `GHS ${(totalPesewas / 100).toFixed(2)}`

  const dueDateText = dueDate
    ? `<p style="margin: 4px 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>`
    : ''

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; color: #333;">
      <h2 style="color: #000;">Invoice from ${safeOrg}</h2>
      <p>Hi ${safeClient},</p>
      <p>You have a new invoice from <strong>${safeOrg}</strong>.</p>
      
      <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Invoice #:</strong> ${safeInvNum}</p>
        <p style="margin: 4px 0;"><strong>Amount:</strong> ${formattedTotal}</p>
        ${dueDateText}
      </div>
      
      <p>Click below to view the full invoice and download a copy.</p>
      
      <a href="${viewUrl}" style="display: inline-block; background-color: #059669; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 10px;">
        View Invoice
      </a>
      
      <p style="margin-top: 24px; color: #999; font-size: 12px;">
        You can also view at: ${viewUrl}
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
      subject: `Invoice ${safeInvNum} from ${safeOrg}`,
      html: htmlContent,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send invoice email:', error)
    return { success: false, error }
  }
}
