-- Migration: Add brief_image_urls column and brief-assets storage bucket
-- The webhook and dashboard code reference brief_image_urls, but the base schema only has asset_urls.
-- This migration adds the missing column and storage bucket so orders are created successfully.

-- 1. Add brief_image_urls column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS brief_image_urls text[] DEFAULT '{}';

-- 2. Create the brief-assets storage bucket (used by checkout form for image uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brief-assets', 'brief-assets', true)
ON CONFLICT DO NOTHING;

-- Storage RLS: brief-assets
CREATE POLICY "Brief assets are publicly accessible."
  ON storage.objects FOR SELECT USING (bucket_id = 'brief-assets');

CREATE POLICY "Anyone can upload brief assets."
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brief-assets');
