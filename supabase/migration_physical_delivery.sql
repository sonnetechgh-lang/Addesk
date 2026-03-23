-- Migration: Physical Product Delivery & On-Premise Engagement
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. Extend packages table with delivery flags
-- =============================================
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS requires_physical_delivery boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_on_premise boolean DEFAULT false;

-- =============================================
-- 2. Extend orders table with delivery fields
-- =============================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'digital',       -- digital | physical | on_premise
  ADD COLUMN IF NOT EXISTS delivery_address jsonb,                      -- { street, city, region, zip, country, notes }
  ADD COLUMN IF NOT EXISTS on_premise_date timestamptz,
  ADD COLUMN IF NOT EXISTS on_premise_location text,
  ADD COLUMN IF NOT EXISTS shipment_status text DEFAULT 'not_applicable'; -- not_applicable | pending | shipped | delivered

-- =============================================
-- 3. Physical shipments tracking table
-- =============================================
CREATE TABLE IF NOT EXISTS public.physical_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  carrier_name text,
  tracking_number text,
  tracking_url text,
  shipping_cost integer DEFAULT 0,  -- in pesewas
  shipped_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for physical_shipments
ALTER TABLE public.physical_shipments ENABLE ROW LEVEL SECURITY;

-- Creators can view shipments for their own orders
CREATE POLICY "Creators can view their own shipments."
  ON physical_shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = physical_shipments.order_id AND orders.influencer_id = auth.uid()
    )
  );

-- Creators can insert shipments for their own orders
CREATE POLICY "Creators can insert shipments for their own orders."
  ON physical_shipments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = physical_shipments.order_id AND orders.influencer_id = auth.uid()
    )
  );

-- Creators can update shipments for their own orders
CREATE POLICY "Creators can update their own shipments."
  ON physical_shipments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = physical_shipments.order_id AND orders.influencer_id = auth.uid()
    )
  );
