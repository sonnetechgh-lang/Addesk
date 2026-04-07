-- =============================================================
-- Phase 3: Creative Briefs & Production
-- Tables: creative_briefs, production_tasks, creative_files
-- Storage: creatives bucket
-- =============================================================

-- -------------------------------------------------------
-- 1. Creative Briefs
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creative_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  line_item_id UUID REFERENCES public.line_items(id),
  order_id UUID REFERENCES public.orders(id),
  campaign_id UUID REFERENCES public.campaigns(id),
  channel_type TEXT NOT NULL,
  title TEXT NOT NULL,
  objective TEXT,
  target_audience TEXT,
  key_messages TEXT,
  deliverables JSONB DEFAULT '[]',
  brand_guidelines_url TEXT,
  reference_asset_urls TEXT[] DEFAULT '{}',
  specs JSONB DEFAULT '{}',
  due_date DATE,
  status TEXT DEFAULT 'draft',  -- draft | assigned | in_production | internal_review | client_review | approved | final
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.creative_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view briefs"
  ON public.creative_briefs FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Authorized members can create briefs"
  ON public.creative_briefs FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
    AND role IN ('owner', 'admin', 'sales', 'production')
  ));

CREATE POLICY "Authorized members can update briefs"
  ON public.creative_briefs FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
    AND role IN ('owner', 'admin', 'sales', 'production')
  ));

CREATE POLICY "Admins can delete briefs"
  ON public.creative_briefs FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
    AND role IN ('owner', 'admin')
  ));

CREATE INDEX IF NOT EXISTS idx_briefs_org ON public.creative_briefs(organization_id);
CREATE INDEX IF NOT EXISTS idx_briefs_campaign ON public.creative_briefs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON public.creative_briefs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_briefs_assigned ON public.creative_briefs(assigned_to);

-- -------------------------------------------------------
-- 2. Production Tasks
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.production_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES public.creative_briefs(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL,  -- design | copywriting | voiceover | filming | editing | typesetting | qc
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  priority TEXT DEFAULT 'medium',  -- low | medium | high | urgent
  status TEXT DEFAULT 'todo',  -- todo | in_progress | review | done | blocked
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.production_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view tasks"
  ON public.production_tasks FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Authorized members can create tasks"
  ON public.production_tasks FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
    AND role IN ('owner', 'admin', 'production')
  ));

CREATE POLICY "Authorized members can update tasks"
  ON public.production_tasks FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
    AND role IN ('owner', 'admin', 'production')
  ));

CREATE POLICY "Admins can delete tasks"
  ON public.production_tasks FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
    AND role IN ('owner', 'admin')
  ));

CREATE INDEX IF NOT EXISTS idx_tasks_brief ON public.production_tasks(brief_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.production_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.production_tasks(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.production_tasks(assigned_to);

-- -------------------------------------------------------
-- 3. Creative Files
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creative_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES public.creative_briefs(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.production_tasks(id),
  uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  version INTEGER DEFAULT 1,
  is_final BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.creative_files ENABLE ROW LEVEL SECURITY;

-- Files inherit access from their brief's org via join
CREATE POLICY "Org members can view files"
  ON public.creative_files FOR SELECT
  USING (brief_id IN (
    SELECT cb.id FROM creative_briefs cb
    JOIN organization_members om ON om.organization_id = cb.organization_id
    WHERE om.user_id = auth.uid() AND om.is_active = true
  ));

CREATE POLICY "Authorized members can upload files"
  ON public.creative_files FOR INSERT
  WITH CHECK (brief_id IN (
    SELECT cb.id FROM creative_briefs cb
    JOIN organization_members om ON om.organization_id = cb.organization_id
    WHERE om.user_id = auth.uid() AND om.is_active = true
    AND om.role IN ('owner', 'admin', 'production')
  ));

CREATE POLICY "Authorized members can update files"
  ON public.creative_files FOR UPDATE
  USING (brief_id IN (
    SELECT cb.id FROM creative_briefs cb
    JOIN organization_members om ON om.organization_id = cb.organization_id
    WHERE om.user_id = auth.uid() AND om.is_active = true
    AND om.role IN ('owner', 'admin', 'production')
  ));

CREATE POLICY "Admins can delete files"
  ON public.creative_files FOR DELETE
  USING (brief_id IN (
    SELECT cb.id FROM creative_briefs cb
    JOIN organization_members om ON om.organization_id = cb.organization_id
    WHERE om.user_id = auth.uid() AND om.is_active = true
    AND om.role IN ('owner', 'admin')
  ));

CREATE INDEX IF NOT EXISTS idx_files_brief ON public.creative_files(brief_id);
CREATE INDEX IF NOT EXISTS idx_files_task ON public.creative_files(task_id);

-- -------------------------------------------------------
-- 4. Storage Bucket for Creatives
-- -------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('creatives', 'creatives', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Org members can view creative files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'creatives' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload creative files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'creatives' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update creative files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'creatives' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete creative files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'creatives' AND auth.role() = 'authenticated');
