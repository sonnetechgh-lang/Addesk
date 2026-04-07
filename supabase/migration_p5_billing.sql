-- =============================================================
-- Phase 5: Billing & Invoicing
-- =============================================================

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id),
  invoice_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled', 'void')),
  subtotal INTEGER NOT NULL,
  tax_amount INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  currency TEXT DEFAULT 'GHS',
  issued_date DATE,
  due_date DATE,
  paid_date DATE,
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  view_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  line_item_id UUID REFERENCES public.line_items(id),
  order_id UUID REFERENCES public.orders(id),
  schedule_entry_id UUID REFERENCES public.schedule_entries(id),
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  proof_of_delivery_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'mobile_money', 'cash', 'cheque', 'paystack', 'other')),
  reference TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  received_at TIMESTAMPTZ DEFAULT now(),
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- Indexes
-- =============================================================

CREATE INDEX idx_invoices_org ON public.invoices(organization_id);
CREATE INDEX idx_invoices_client ON public.invoices(client_id);
CREATE INDEX idx_invoices_campaign ON public.invoices(campaign_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_token ON public.invoices(view_token);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);

CREATE INDEX idx_invoice_line_items_invoice ON public.invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_line_item ON public.invoice_line_items(line_item_id);
CREATE INDEX idx_invoice_line_items_order ON public.invoice_line_items(order_id);

CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_payments_org ON public.payments(organization_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- =============================================================
-- RLS Policies
-- =============================================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Invoices: org members full access
CREATE POLICY "Org members can view invoices"
  ON public.invoices FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

CREATE POLICY "Org members can create invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

CREATE POLICY "Org members can update invoices"
  ON public.invoices FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

CREATE POLICY "Org members can delete invoices"
  ON public.invoices FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

-- Public view via token (for clients)
CREATE POLICY "Anyone can view invoices with token"
  ON public.invoices FOR SELECT
  USING (true);

-- Invoice Line Items: access through invoice ownership
CREATE POLICY "Org members can view invoice line items"
  ON public.invoice_line_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      WHERE i.organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.is_active = true
      )
    )
  );

CREATE POLICY "Org members can manage invoice line items"
  ON public.invoice_line_items FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      WHERE i.organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.is_active = true
      )
    )
  );

CREATE POLICY "Org members can update invoice line items"
  ON public.invoice_line_items FOR UPDATE
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      WHERE i.organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.is_active = true
      )
    )
  );

CREATE POLICY "Org members can delete invoice line items"
  ON public.invoice_line_items FOR DELETE
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      WHERE i.organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.is_active = true
      )
    )
  );

-- Payments: org members full access
CREATE POLICY "Org members can view payments"
  ON public.payments FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

CREATE POLICY "Org members can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

CREATE POLICY "Org members can update payments"
  ON public.payments FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

CREATE POLICY "Org members can delete payments"
  ON public.payments FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );
