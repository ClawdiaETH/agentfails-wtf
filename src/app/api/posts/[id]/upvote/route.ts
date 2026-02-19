/**
 * POST /api/posts/[id]/upvote — Upvote a fail post.
 *
 * Free action. No payment required.
 * Requires wallet_address in body to prevent duplicate upvotes (stored in votes table).
 *
 * Body: { wallet_address: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: postId } = await params;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* wallet optional */ }

  const voter = (body.wallet_address as string | undefined)?.toLowerCase() ?? null;

  const supabase = getSupabaseAdmin();

  // Record the vote (idempotent by voter+post unique constraint)
  if (voter) {
    const { error: voteErr } = await supabase
      .from('votes')
      .insert({ post_id: postId, voter_wallet: voter });

    if (voteErr && voteErr.code !== '23505') {
      return NextResponse.json({ error: voteErr.message }, { status: 500 });
    }
    if (voteErr?.code === '23505') {
      return NextResponse.json({ error: 'Already upvoted' }, { status: 409 });
    }
  }

  // Increment upvote_count
  const { error } = await supabase.rpc('increment_upvote', { post_id: postId });
  if (error) {
    // Fallback: manual increment
    const { data: current } = await supabase
      .from('posts')
      .select('upvote_count')
      .eq('id', postId)
      .single();

    const currentCount = (current as { upvote_count?: number } | null)?.upvote_count ?? 0;
    await supabase
      .from('posts')
      .update({ upvote_count: currentCount + 1 })
      .eq('id', postId);
  }

  return NextResponse.json({ ok: true });
}
