-- Profile views tracking table
CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewer_ip TEXT,              -- anonymised visitor identifier
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Influencers can read their own view counts
CREATE POLICY "Users can view own profile views"
    ON public.profile_views FOR SELECT
    USING (auth.uid() = profile_id);

-- No public INSERT policy — admin client bypasses RLS for inserts

-- Index for fast per-profile count queries
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_created
    ON public.profile_views (profile_id, created_at DESC);
