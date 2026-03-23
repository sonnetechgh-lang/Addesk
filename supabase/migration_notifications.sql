-- Notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,          -- 'new_order' | 'order_completed' | 'order_cancelled' | 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,                   -- optional deep-link path e.g. '/dashboard/orders/<id>'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role inserts notifications (via admin client in webhooks/actions)
-- No public INSERT policy needed — admin client bypasses RLS

-- Index for fast per-user queries sorted by time
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON public.notifications (user_id, created_at DESC);

-- Index for unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON public.notifications (user_id, is_read) WHERE is_read = FALSE;
