-- Migration: Phase 0 - Organizations & Multi-Tenancy Foundation
-- File: supabase/migration_p0_organizations.sql
-- Description: Creates organizations, organization_members tables; extends profiles
-- Safe to re-run (uses IF NOT EXISTS / DO blocks)

-- =============================================================
-- 1. Create Organizations Table
-- =============================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'influencer'
    CHECK (type IN ('influencer', 'media_house', 'agency')),
  logo_url TEXT,
  website TEXT,
  paystack_subaccount_code TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 2. Create Organization Members Table (RBAC)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'sales', 'production', 'finance', 'member')),
  invited_email TEXT,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 3. Extend Profiles Table
-- =============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'influencer',
  ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS display_role TEXT DEFAULT 'creator';

-- =============================================================
-- 4. Add organization_id to Existing Tables (nullable for backcompat)
-- =============================================================

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- =============================================================
-- 5. RLS Policies - Organizations
-- =============================================================

-- Anyone in the org can view it
DO $$ BEGIN
  CREATE POLICY "Members can view their organization"
    ON public.organizations FOR SELECT
    USING (
      id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only owners can update org settings
DO $$ BEGIN
  CREATE POLICY "Owners can update their organization"
    ON public.organizations FOR UPDATE
    USING (
      id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Authenticated users can create organizations (for onboarding)
DO $$ BEGIN
  CREATE POLICY "Authenticated users can create organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- 6. RLS Policies - Organization Members
-- =============================================================

-- Members can view other members in the same org
DO $$ BEGIN
  CREATE POLICY "Members can view org members"
    ON public.organization_members FOR SELECT
    USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members AS om
        WHERE om.user_id = auth.uid() AND om.is_active = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admins/owners can add members
DO $$ BEGIN
  CREATE POLICY "Admins can insert org members"
    ON public.organization_members FOR INSERT
    WITH CHECK (
      organization_id IN (
        SELECT organization_id FROM public.organization_members AS om
        WHERE om.user_id = auth.uid() AND om.is_active = true
        AND om.role IN ('owner', 'admin')
      )
      -- OR: the user is creating their own membership (self-onboarding as owner)
      OR (user_id = auth.uid() AND role = 'owner')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admins/owners can update members (change roles, deactivate)
DO $$ BEGIN
  CREATE POLICY "Admins can update org members"
    ON public.organization_members FOR UPDATE
    USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members AS om
        WHERE om.user_id = auth.uid() AND om.is_active = true
        AND om.role IN ('owner', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admins/owners can remove members
DO $$ BEGIN
  CREATE POLICY "Admins can delete org members"
    ON public.organization_members FOR DELETE
    USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members AS om
        WHERE om.user_id = auth.uid() AND om.is_active = true
        AND om.role IN ('owner', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- 7. Extended RLS for Packages (org-scoped, backward compat)
-- =============================================================

-- Add org-scoped policy alongside existing influencer_id policy
DO $$ BEGIN
  CREATE POLICY "Org members can manage org packages"
    ON public.packages FOR ALL
    USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- 8. Extended RLS for Orders (org-scoped, backward compat)
-- =============================================================

DO $$ BEGIN
  CREATE POLICY "Org members can view org orders"
    ON public.orders FOR SELECT
    USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- 9. Indexes
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_org_members_user
  ON public.organization_members(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_org_members_org
  ON public.organization_members(organization_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_organizations_slug
  ON public.organizations(slug);

CREATE INDEX IF NOT EXISTS idx_profiles_current_org
  ON public.profiles(current_organization_id);

CREATE INDEX IF NOT EXISTS idx_packages_org
  ON public.packages(organization_id);

CREATE INDEX IF NOT EXISTS idx_orders_org
  ON public.orders(organization_id);

-- =============================================================
-- 10. Backfill: Auto-create solo orgs for existing influencers
-- =============================================================

-- This creates an organization for each onboarded influencer and links them as owner.
-- Safe to re-run: skips profiles that already have a current_organization_id.
DO $$
DECLARE
  profile_row RECORD;
  new_org_id UUID;
BEGIN
  FOR profile_row IN
    SELECT id, username, full_name, paystack_subaccount_code
    FROM public.profiles
    WHERE current_organization_id IS NULL
      AND is_onboarded = true
  LOOP
    -- Create solo org
    INSERT INTO public.organizations (name, slug, type, paystack_subaccount_code)
    VALUES (
      profile_row.full_name,
      profile_row.username,
      'influencer',
      profile_row.paystack_subaccount_code
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO new_org_id;

    -- Add as owner
    INSERT INTO public.organization_members (organization_id, user_id, role, accepted_at)
    VALUES (new_org_id, profile_row.id, 'owner', now())
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- Link profile to org
    UPDATE public.profiles
    SET current_organization_id = new_org_id,
        account_type = 'influencer'
    WHERE id = profile_row.id;
  END LOOP;

  -- Backfill organization_id on packages
  UPDATE public.packages p
  SET organization_id = pr.current_organization_id
  FROM public.profiles pr
  WHERE p.influencer_id = pr.id
    AND p.organization_id IS NULL
    AND pr.current_organization_id IS NOT NULL;

  -- Backfill organization_id on orders
  UPDATE public.orders o
  SET organization_id = pr.current_organization_id
  FROM public.profiles pr
  WHERE o.influencer_id = pr.id
    AND o.organization_id IS NULL
    AND pr.current_organization_id IS NOT NULL;
END $$;
