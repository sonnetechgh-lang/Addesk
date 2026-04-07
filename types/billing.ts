// =============================================================
// Billing & Invoice Type Definitions
// =============================================================

// -------------------------------------------------------
// Invoice Statuses
// -------------------------------------------------------

export const INVOICE_STATUSES = [
  'draft',
  'sent',
  'viewed',
  'paid',
  'partial',
  'overdue',
  'cancelled',
  'void',
] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  paid: 'Paid',
  partial: 'Partial',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  void: 'Void',
}

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  sent: 'bg-blue-50 text-blue-700',
  viewed: 'bg-purple-50 text-purple-700',
  paid: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-600',
  cancelled: 'bg-zinc-100 text-zinc-500',
  void: 'bg-zinc-100 text-zinc-400',
}

// -------------------------------------------------------
// Payment Methods
// -------------------------------------------------------

export const PAYMENT_METHODS = [
  'bank_transfer',
  'mobile_money',
  'cash',
  'cheque',
  'paystack',
  'other',
] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  mobile_money: 'Mobile Money',
  cash: 'Cash',
  cheque: 'Cheque',
  paystack: 'Paystack',
  other: 'Other',
}

export const PAYMENT_STATUSES = [
  'completed',
  'pending',
  'failed',
  'refunded',
] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

// -------------------------------------------------------
// Database Row Types
// -------------------------------------------------------

export type Invoice = {
  id: string
  organization_id: string
  client_id: string
  campaign_id: string | null
  invoice_number: string
  status: InvoiceStatus
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  currency: string
  issued_date: string | null
  due_date: string | null
  paid_date: string | null
  payment_method: string | null
  payment_reference: string | null
  notes: string | null
  view_token: string
  created_by: string
  created_at: string
  updated_at: string
}

export type InvoiceLineItem = {
  id: string
  invoice_id: string
  line_item_id: string | null
  order_id: string | null
  schedule_entry_id: string | null
  description: string
  quantity: number
  unit_price: number
  total_price: number
  proof_of_delivery_urls: string[]
  created_at: string
}

export type Payment = {
  id: string
  invoice_id: string
  organization_id: string
  amount: number
  method: PaymentMethod
  reference: string | null
  status: PaymentStatus
  received_at: string
  recorded_by: string | null
  created_at: string
}

// -------------------------------------------------------
// Composite Types
// -------------------------------------------------------

export type InvoiceWithDetails = Invoice & {
  clients: {
    company_name: string
    contact_name: string
    contact_email: string
  }
  campaigns: {
    name: string
  } | null
  invoice_line_items: InvoiceLineItem[]
  payments: Payment[]
}

export type InvoiceSummary = Invoice & {
  clients: {
    company_name: string
    contact_name: string
  }
  campaigns: {
    name: string
  } | null
  _paid_total?: number
}
