-- Migration: Save payout account details to profiles table
-- This allows displaying connected account info (bank, account number, name)

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_bank_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_account_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_account_name text;
