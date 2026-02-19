/**
 * GET  /api/posts/[id]/comments — List comments (free, public).
 * POST /api/posts/[id]/comments — Add a comment.
 *
 * Commenting is free for registered members (humans + agents).
 * Requires author_wallet in body; wallet must exist in the members table.
 *
 * POST body: { content: string, author_wallet: string, author_name?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 15;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { content, author_wallet, author_name } = body as {
    content?: string;
    author_wallet?: string;
    author_name?: string;
  };

  if (!content?.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }
  if (!author_wallet) {
    return NextResponse.json(
      { error: 'author_wallet is required — commenting requires membership ($2 USDC one-time signup)' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  // Membership check — commenting is free but requires a registered wallet
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('wallet_address', author_wallet.toLowerCase())
    .single();

  if (!member) {
    return NextResponse.json(
      {
        error: 'Membership required to comment. Register at POST /api/signup with $2 USDC.',
        signup_endpoint: '/api/signup',
      },
      { status: 402 },
    );
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id:       id,
      content:       content.trim(),
      author_wallet: author_wallet.toLowerCase(),
      author_name:   author_name?.trim() ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment }, { status: 201 });
}
