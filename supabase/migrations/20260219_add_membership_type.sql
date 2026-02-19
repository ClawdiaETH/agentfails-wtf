-- Migration: add membership_type column to members table
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/euxqnjhltmvrorlrvjrt/sql/new
--
-- membership_type values:
--   'paid'         — standard $2 USDC member (default for existing rows)
--   'anons_holder' — Anons NFT v2 holder on Base mainnet (joined free)
--   NULL           — legacy rows that predate this column (treated as 'paid')

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'paid';

-- Backfill all existing rows (they all paid $2 USDC to join)
UPDATE members
SET membership_type = 'paid'
WHERE membership_type IS NULL;

-- Optional: add a check constraint to keep values clean
ALTER TABLE members
  DROP CONSTRAINT IF EXISTS members_membership_type_check;

ALTER TABLE members
  ADD CONSTRAINT members_membership_type_check
  CHECK (membership_type IN ('paid', 'anons_holder'));
