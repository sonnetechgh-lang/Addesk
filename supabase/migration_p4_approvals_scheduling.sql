-- =============================================================
-- Phase 4: Approval & Scheduling
-- =============================================================

-- Approval Requests
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES public.creative_briefs(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  creative_file_id UUID REFERENCES public.creative_files(id),
  client_id UUID REFERENCES public.clients(id),
  client_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revision_requested', 'expired')),
  review_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  comments TEXT,
  reviewed_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Schedule Entries
CREATE TABLE IF NOT EXISTS public.schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  line_item_id UUID REFERENCES public.line_items(id),
  order_id UUID REFERENCES public.orders(id),
  ad_slot_id UUID REFERENCES public.ad_slots(id) NOT NULL,
  channel_id UUID REFERENCES public.channels(id) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  end_date DATE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled', 'missed')),
  proof_of_run_urls TEXT[] DEFAULT '{}',
  confirmed_by UUID REFERENCES public.profiles(id),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ad_slot_id, scheduled_date, scheduled_time)
);

-- =============================================================
-- Indexes
-- =============================================================

CREATE INDEX idx_approval_requests_org ON public.approval_requests(organization_id);
CREATE INDEX idx_approval_requests_brief ON public.approval_requests(brief_id);
CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX idx_approval_requests_token ON public.approval_requests(review_token);
CREATE INDEX idx_approval_requests_client ON public.approval_requests(client_id);

CREATE INDEX idx_schedule_entries_org ON public.schedule_entries(organization_id);
CREATE INDEX idx_schedule_entries_channel ON public.schedule_entries(channel_id);
CREATE INDEX idx_schedule_entries_slot ON public.schedule_entries(ad_slot_id);
CREATE INDEX idx_schedule_entries_date ON public.schedule_entries(scheduled_date);
CREATE INDEX idx_schedule_entries_status ON public.schedule_entries(status);

-- =============================================================
-- RLS Policies
-- =============================================================

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;

-- Approval Requests: org members can view
CREATE POLICY "Org members can view approval requests"
  ON public.approval_requests FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

-- Approval Requests: org members can insert
CREATE POLICY "Org members can create approval requests"
  ON public.approval_requests FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

-- Approval Requests: org members can update
CREATE POLICY "Org members can update approval requests"
  ON public.approval_requests FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

-- Approval Requests: org members can delete
CREATE POLICY "Org members can delete approval requests"
  ON public.approval_requests FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

-- Public review: anyone with a valid token can read (for client portal)
CREATE POLICY "Anyone with review token can view approval"
  ON public.approval_requests FOR SELECT
  USING (true);
  -- Token-based access is enforced at the application layer via exact token match

-- Schedule Entries: org members can view
CREATE POLICY "Org members can view schedule entries"
  ON public.schedule_entries FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

-- Schedule Entries: org members can insert
CREATE POLICY "Org members can create schedule entries"
  ON public.schedule_entries FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

-- Schedule Entries: org members can update
CREATE POLICY "Org members can update schedule entries"
  ON public.schedule_entries FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

-- Schedule Entries: org members can delete
CREATE POLICY "Org members can delete schedule entries"
  ON public.schedule_entries FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );
