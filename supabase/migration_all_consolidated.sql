-- ============================================================
-- Consolidated Migration Script for AdDesk
-- Safe to re-run: all statements use IF NOT EXISTS / ON CONFLICT
-- Run this in the Supabase SQL Editor
-- ============================================================


-- ============================================================
-- 1. BRIEF ASSETS (brief_image_urls + storage bucket)
-- ============================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS brief_image_urls text[] DEFAULT '{}';

INSERT INTO storage.buckets (id, name, public)
VALUES ('brief-assets', 'brief-assets', true)
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Brief assets are publicly accessible.' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Brief assets are publicly accessible."
      ON storage.objects FOR SELECT USING (bucket_id = 'brief-assets');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload brief assets.' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Anyone can upload brief assets."
      ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brief-assets');
  END IF;
END $$;


-- ============================================================
-- 2. CLICKWRAP CONSENT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    terms_version TEXT NOT NULL
);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own consent logs' AND tablename = 'consent_logs'
  ) THEN
    CREATE POLICY "Users can view own consent logs"
      ON public.consent_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own consent logs' AND tablename = 'consent_logs'
  ) THEN
    CREATE POLICY "Users can insert own consent logs"
      ON public.consent_logs FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.client_consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_email TEXT NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    terms_version TEXT NOT NULL
);

ALTER TABLE public.client_consent_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert client consent logs' AND tablename = 'client_consent_logs'
  ) THEN
    CREATE POLICY "Anyone can insert client consent logs"
      ON public.client_consent_logs FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Influencers can view client consent logs for their profile' AND tablename = 'client_consent_logs'
  ) THEN
    CREATE POLICY "Influencers can view client consent logs for their profile"
      ON public.client_consent_logs FOR SELECT
      USING (auth.uid() = influencer_id);
  END IF;
END $$;


-- ============================================================
-- 3. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
      ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
      ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON public.notifications (user_id, is_read) WHERE is_read = FALSE;


-- ============================================================
-- 4. PAYOUT DETAILS
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_bank_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_account_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_account_name text;


-- ============================================================
-- 5. PHYSICAL DELIVERY
-- ============================================================
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS requires_physical_delivery boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_on_premise boolean DEFAULT false;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'digital',
  ADD COLUMN IF NOT EXISTS delivery_address jsonb,
  ADD COLUMN IF NOT EXISTS on_premise_date timestamptz,
  ADD COLUMN IF NOT EXISTS on_premise_location text,
  ADD COLUMN IF NOT EXISTS shipment_status text DEFAULT 'not_applicable';

CREATE TABLE IF NOT EXISTS public.physical_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  carrier_name text,
  tracking_number text,
  tracking_url text,
  shipping_cost integer DEFAULT 0,
  shipped_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.physical_shipments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Creators can view their own shipments.' AND tablename = 'physical_shipments'
  ) THEN
    CREATE POLICY "Creators can view their own shipments."
      ON physical_shipments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM orders WHERE orders.id = physical_shipments.order_id AND orders.influencer_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Creators can insert shipments for their own orders.' AND tablename = 'physical_shipments'
  ) THEN
    CREATE POLICY "Creators can insert shipments for their own orders."
      ON physical_shipments FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM orders WHERE orders.id = physical_shipments.order_id AND orders.influencer_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Creators can update their own shipments.' AND tablename = 'physical_shipments'
  ) THEN
    CREATE POLICY "Creators can update their own shipments."
      ON physical_shipments FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM orders WHERE orders.id = physical_shipments.order_id AND orders.influencer_id = auth.uid()
        )
      );
  END IF;
END $$;


-- ============================================================
-- 6. PROFILE VIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewer_ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile views' AND tablename = 'profile_views'
  ) THEN
    CREATE POLICY "Users can view own profile views"
      ON public.profile_views FOR SELECT
      USING (auth.uid() = profile_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profile_views_profile_created
    ON public.profile_views (profile_id, created_at DESC);


-- ============================================================
-- 7. PUSH SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own subscriptions' AND tablename = 'push_subscriptions'
  ) THEN
    CREATE POLICY "Users manage own subscriptions"
      ON push_subscriptions
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
