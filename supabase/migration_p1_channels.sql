-- =============================================================
-- Migration: Phase 1 - Multi-Channel Core
-- File: supabase/migration_p1_channels.sql
-- Description: Adds channels, ad_slots, rate_cards tables and
--              extends packages with channel linkage.
-- Safe to re-run (uses IF NOT EXISTS / DO blocks)
-- =============================================================

-- 1. Channels
-- =============================================================

CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('influencer', 'print', 'digital', 'broadcast_tv', 'broadcast_radio')),
  name TEXT NOT NULL,
  description TEXT,
  specs JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- RLS: Org members can view channels
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Org members can view channels' AND tablename = 'channels'
  ) THEN
    CREATE POLICY "Org members can view channels"
      ON public.channels FOR SELECT
      USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
      ));
  END IF;
END $$;

-- RLS: Admins can insert channels
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert channels' AND tablename = 'channels'
  ) THEN
    CREATE POLICY "Admins can insert channels"
      ON public.channels FOR INSERT
      WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'admin')
      ));
  END IF;
END $$;

-- RLS: Admins can update channels
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update channels' AND tablename = 'channels'
  ) THEN
    CREATE POLICY "Admins can update channels"
      ON public.channels FOR UPDATE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'admin')
      ));
  END IF;
END $$;

-- RLS: Admins can delete channels
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete channels' AND tablename = 'channels'
  ) THEN
    CREATE POLICY "Admins can delete channels"
      ON public.channels FOR DELETE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'admin')
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_channels_org ON channels(organization_id) WHERE is_active = true;


-- 2. Ad Slots
-- =============================================================

CREATE TABLE IF NOT EXISTS public.ad_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('print_page', 'broadcast_spot', 'digital_placement', 'social_post')),
  specs JSONB DEFAULT '{}',
  base_price INTEGER NOT NULL,  -- pesewas
  currency TEXT DEFAULT 'GHS',
  availability_schedule JSONB DEFAULT '{}',
  max_units_per_period INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;

-- RLS: Org members can view slots
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Org members can view ad_slots' AND tablename = 'ad_slots'
  ) THEN
    CREATE POLICY "Org members can view ad_slots"
      ON public.ad_slots FOR SELECT
      USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
      ));
  END IF;
END $$;

-- RLS: Admins can insert slots
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert ad_slots' AND tablename = 'ad_slots'
  ) THEN
    CREATE POLICY "Admins can insert ad_slots"
      ON public.ad_slots FOR INSERT
      WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'admin')
      ));
  END IF;
END $$;

-- RLS: Admins can update slots
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update ad_slots' AND tablename = 'ad_slots'
  ) THEN
    CREATE POLICY "Admins can update ad_slots"
      ON public.ad_slots FOR UPDATE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'admin')
      ));
  END IF;
END $$;

-- RLS: Admins can delete slots
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete ad_slots' AND tablename = 'ad_slots'
  ) THEN
    CREATE POLICY "Admins can delete ad_slots"
      ON public.ad_slots FOR DELETE
      USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'admin')
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ad_slots_channel ON ad_slots(channel_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ad_slots_org ON ad_slots(organization_id) WHERE is_active = true;


-- 3. Rate Cards
-- =============================================================

CREATE TABLE IF NOT EXISTS public.rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_slot_id UUID REFERENCES public.ad_slots(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,  -- pesewas
  valid_from DATE,
  valid_to DATE,
  conditions JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rate_cards ENABLE ROW LEVEL SECURITY;

-- RLS: Org members can view rate cards (via slot → org membership)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Org members can view rate_cards' AND tablename = 'rate_cards'
  ) THEN
    CREATE POLICY "Org members can view rate_cards"
      ON public.rate_cards FOR SELECT
      USING (ad_slot_id IN (
        SELECT id FROM ad_slots WHERE organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      ));
  END IF;
END $$;

-- RLS: Admins can insert rate cards
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert rate_cards' AND tablename = 'rate_cards'
  ) THEN
    CREATE POLICY "Admins can insert rate_cards"
      ON public.rate_cards FOR INSERT
      WITH CHECK (ad_slot_id IN (
        SELECT id FROM ad_slots WHERE organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
          AND role IN ('owner', 'admin')
        )
      ));
  END IF;
END $$;

-- RLS: Admins can update rate cards
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update rate_cards' AND tablename = 'rate_cards'
  ) THEN
    CREATE POLICY "Admins can update rate_cards"
      ON public.rate_cards FOR UPDATE
      USING (ad_slot_id IN (
        SELECT id FROM ad_slots WHERE organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
          AND role IN ('owner', 'admin')
        )
      ));
  END IF;
END $$;

-- RLS: Admins can delete rate cards
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete rate_cards' AND tablename = 'rate_cards'
  ) THEN
    CREATE POLICY "Admins can delete rate_cards"
      ON public.rate_cards FOR DELETE
      USING (ad_slot_id IN (
        SELECT id FROM ad_slots WHERE organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
          AND role IN ('owner', 'admin')
        )
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rate_cards_slot ON rate_cards(ad_slot_id);


-- 4. Extend Packages with Channel Linkage (backward compatible)
-- =============================================================

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id),
  ADD COLUMN IF NOT EXISTS ad_slot_id UUID REFERENCES public.ad_slots(id),
  ADD COLUMN IF NOT EXISTS channel_type TEXT DEFAULT 'influencer';
