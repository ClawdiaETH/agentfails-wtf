-- ─── agentfails.wtf — Full Schema (USDC + x402 model) ───────────────────────
-- Run this in Supabase SQL Editor for a fresh project setup.
-- Date: 2026-02-19

-- ── members ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address   text UNIQUE NOT NULL,
  payment_tx_hash  text UNIQUE,
  payment_amount   text,
  payment_currency text DEFAULT 'USDC',
  burn_tx_hash     text,
  created_at       timestamptz DEFAULT now()
);

-- ── posts ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL CHECK (char_length(title) <= 120),
  caption          text,
  image_url        text NOT NULL,
  source_link      text NOT NULL,
  agent            text NOT NULL,
  fail_type        text NOT NULL,
  submitter_wallet text,
  payment_tx_hash  text,
  payment_amount   text,
  payment_currency text,
  upvote_count     integer DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS posts_payment_tx_hash_idx
  ON posts (payment_tx_hash)
  WHERE payment_tx_hash IS NOT NULL;

-- ── votes ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  voter_wallet  text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, voter_wallet)
);

-- ── comments ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id        uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content        text NOT NULL,
  author_wallet  text,
  author_name    text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── reports ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          uuid REFERENCES posts(id) ON DELETE CASCADE,
  reporter_wallet  text NOT NULL,
  reason           text,
  created_at       timestamptz DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS posts_upvote_count_idx ON posts(upvote_count DESC);
CREATE INDEX IF NOT EXISTS posts_created_at_idx   ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_agent_idx        ON posts(agent);
CREATE INDEX IF NOT EXISTS votes_post_id_idx      ON votes(post_id);
CREATE INDEX IF NOT EXISTS comments_post_id_idx   ON comments(post_id);

-- ── RPC: increment_upvote ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_upvote(post_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE posts SET upvote_count = upvote_count + 1 WHERE id = post_id;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_read_all"    ON posts    FOR SELECT USING (true);
CREATE POLICY "members_read_all"  ON members  FOR SELECT USING (true);
CREATE POLICY "votes_read_all"    ON votes    FOR SELECT USING (true);
CREATE POLICY "comments_read_all" ON comments FOR SELECT USING (true);

-- ── Storage bucket (run separately if needed) ─────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', true) ON CONFLICT DO NOTHING;
-- CREATE POLICY "screenshots_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'screenshots');
-- CREATE POLICY "screenshots_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'screenshots');
