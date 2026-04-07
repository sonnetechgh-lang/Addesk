import { createClient } from '@/lib/supabase/server'

/**
 * Generate the next sequential invoice number for an organization.
 * Format: INV-YYYYMM-NNNN (e.g. INV-202604-0001)
 */
export async function generateInvoiceNumber(orgId: string): Promise<string> {
  const supabase = await createClient()
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const prefix = `INV-${yearMonth}-`

  // Find the latest invoice number with this prefix for the org
  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('organization_id', orgId)
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)

  let nextSeq = 1
  if (data && data.length > 0) {
    const lastNum = data[0].invoice_number
    const seqPart = lastNum.replace(prefix, '')
    const parsed = parseInt(seqPart, 10)
    if (!isNaN(parsed)) {
      nextSeq = parsed + 1
    }
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`
}
