-- =============================================================
-- Phase 2: Sales Pipeline & Campaign Management
-- Tables: clients, campaigns, line_items, activity_log
-- =============================================================

-- -------------------------------------------------------
-- 1. Clients (CRM)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  billing_address JSONB DEFAULT '{}',
  credit_terms TEXT DEFAULT 'prepaid',  -- prepaid | net_15 | net_30 | net_60
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view clients"
  ON public.clients FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Authorized members can create clients"
  ON public.clients FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
    AND role IN ('owner', 'admin', 'sales')
  ));

CREATE POLICY "Authorized members can update clients"
  ON public.clients FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
    AND role IN ('owner', 'admin', 'sales')
  ));

CREATE POLICY "Admins can delete clients"
  ON public.clients FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
    AND role IN ('owner', 'admin')
  ));

CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(organization_id, contact_email);

-- -------------------------------------------------------
-- 2. Campaigns
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  total_budget INTEGER,  -- pesewas
  status TEXT DEFAULT 'draft',  -- draft | active | paused | completed | cancelled
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view campaigns"
  ON public.campaigns FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Authorized members can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
    AND role IN ('owner', 'admin', 'sales')
  ));

CREATE POLICY "Authorized members can update campaigns"
  ON public.campaigns FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
    AND role IN ('owner', 'admin', 'sales')
  ));

CREATE POLICY "Admins can delete campaigns"
  ON public.campaigns FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
    AND role IN ('owner', 'admin')
  ));

CREATE INDEX IF NOT EXISTS idx_campaigns_org ON public.campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON public.campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_assigned ON public.campaigns(assigned_to);

-- -------------------------------------------------------
-- 3. Line Items
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  ad_slot_id UUID REFERENCES public.ad_slots(id),
  channel_id UUID REFERENCES public.channels(id) NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price INTEGER NOT NULL,  -- pesewas
  total_price INTEGER NOT NULL, -- pesewas
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',  -- pending | confirmed | in_production | scheduled | live | completed | cancelled
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;

-- Line items inherit access from their campaign's org
CREATE POLICY "Org members can view line items"
  ON public.line_items FOR SELECT
  USING (campaign_id IN (
    SELECT c.id FROM campaigns c
    JOIN organization_members om ON om.organization_id = c.organization_id
    WHERE om.user_id = auth.uid() AND om.is_active = true
  ));

CREATE POLICY "Authorized members can create line items"
  ON public.line_items FOR INSERT
  WITH CHECK (campaign_id IN (
    SELECT c.id FROM campaigns c
    JOIN organization_members om ON om.organization_id = c.organization_id
    WHERE om.user_id = auth.uid() AND om.is_active = true
    AND om.role IN ('owner', 'admin', 'sales')
  ));

CREATE POLICY "Authorized members can update line items"
  ON public.line_items FOR UPDATE
  USING (campaign_id IN (
    SELECT c.id FROM campaigns c
    JOIN organization_members om ON om.organization_id = c.organization_id
    WHERE om.user_id = auth.uid() AND om.is_active = true
    AND om.role IN ('owner', 'admin', 'sales')
  ));

CREATE POLICY "Authorized members can delete line items"
  ON public.line_items FOR DELETE
  USING (campaign_id IN (
    SELECT c.id FROM campaigns c
    JOIN organization_members om ON om.organization_id = c.organization_id
    WHERE om.user_id = auth.uid() AND om.is_active = true
    AND om.role IN ('owner', 'admin', 'sales')
  ));

CREATE INDEX IF NOT EXISTS idx_line_items_campaign ON public.line_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_line_items_channel ON public.line_items(channel_id);
CREATE INDEX IF NOT EXISTS idx_line_items_slot ON public.line_items(ad_slot_id);
CREATE INDEX IF NOT EXISTS idx_line_items_status ON public.line_items(campaign_id, status);

-- -------------------------------------------------------
-- 4. Activity Log
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL,  -- client | campaign | line_item | channel | invoice | etc.
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,       -- created | updated | deleted | status_changed | assigned | etc.
  actor_id UUID REFERENCES public.profiles(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view activity"
  ON public.activity_log FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Org members can insert activity"
  ON public.activity_log FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX IF NOT EXISTS idx_activity_org ON public.activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON public.activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_log(organization_id, created_at DESC);
