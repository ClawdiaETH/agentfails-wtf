-- agentfails.wtf — Payment Rebuild Migration
-- Run in Supabase SQL editor or via `supabase db push`
-- Date: 2026-02-19

-- ── members table ─────────────────────────────────────────────────────────────
-- Migrate from $CLAWDIA burn to USDC payment

-- Add new payment columns (keep burn_tx_hash for historical data, nullable)
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS payment_tx_hash  text,
  ADD COLUMN IF NOT EXISTS payment_amount   text,
  ADD COLUMN IF NOT EXISTS payment_currency text DEFAULT 'USDC';

-- Copy existing burn hashes into payment_tx_hash for backward compat
UPDATE members
SET payment_tx_hash = burn_tx_hash,
    payment_amount  = '2.00',
    payment_currency = 'CLAWDIA_BURN'
WHERE burn_tx_hash IS NOT NULL
  AND payment_tx_hash IS NULL;

-- Create unique constraint on payment_tx_hash (prevent replay attacks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'members_payment_tx_hash_key'
  ) THEN
    ALTER TABLE members ADD CONSTRAINT members_payment_tx_hash_key UNIQUE (payment_tx_hash);
  END IF;
END $$;

-- ── posts table — add payment columns ────────────────────────────────────────
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS payment_tx_hash  text,
  ADD COLUMN IF NOT EXISTS payment_amount   text,
  ADD COLUMN IF NOT EXISTS payment_currency text;

-- Unique index on payment_tx_hash for posts (x402 replay protection)
CREATE UNIQUE INDEX IF NOT EXISTS posts_payment_tx_hash_idx
  ON posts (payment_tx_hash)
  WHERE payment_tx_hash IS NOT NULL;

-- ── votes table ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  voter_wallet  text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, voter_wallet)
);

CREATE INDEX IF NOT EXISTS votes_post_id_idx ON votes (post_id);

-- ── comments table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id        uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content        text NOT NULL,
  author_wallet  text,
  author_name    text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments (post_id);

-- ── RPC helper: increment_upvote ─────────────────────────────────────────────
-- Called by the /api/posts/[id]/upvote route
CREATE OR REPLACE FUNCTION increment_upvote(post_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE posts SET upvote_count = upvote_count + 1 WHERE id = post_id;
$$;

-- ── RLS policies ──────────────────────────────────────────────────────────────
-- Enable RLS on all tables (adjust as needed for your Supabase setup)

ALTER TABLE members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow anon reads on posts/comments/votes
CREATE POLICY IF NOT EXISTS "posts_read_all"    ON posts    FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "comments_read_all" ON comments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "votes_read_all"    ON votes    FOR SELECT USING (true);

-- Service role can do everything (API routes use service role key)
-- INSERT/UPDATE/DELETE are locked down to service role — no anon writes.
