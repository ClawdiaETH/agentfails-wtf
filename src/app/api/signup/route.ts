/**
 * POST /api/signup — Register a human member after $2 USDC payment.
 *
 * The frontend sends USDC on Base, then calls this endpoint with the tx hash.
 * We verify the tx on-chain before writing to the members table.
 *
 * Body: { wallet_address: string, tx_hash: string }
 *
 * Response:
 *   201 { member }
 *   400 { error }
 *   422 { error } — payment invalid
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUsdcPayment } from '@/lib/payments';
import { SIGNUP_USDC_AMOUNT } from '@/lib/constants';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { wallet_address, tx_hash } = body;

  if (!wallet_address || !/^0x[0-9a-fA-F]{40}$/.test(wallet_address)) {
    return NextResponse.json({ error: 'Invalid wallet_address' }, { status: 400 });
  }
  if (!tx_hash) {
    return NextResponse.json({ error: 'tx_hash is required' }, { status: 400 });
  }

  // Verify the USDC payment on Base
  const verification = await verifyUsdcPayment(tx_hash, SIGNUP_USDC_AMOUNT);
  if (!verification.ok) {
    return NextResponse.json(
      { error: `Payment verification failed: ${verification.error}` },
      { status: 422 },
    );
  }

  const supabase = getSupabaseAdmin();

  // Check if tx was already used
  const { data: existing } = await supabase
    .from('members')
    .select('id')
    .eq('payment_tx_hash', tx_hash)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'This payment tx has already been used' }, { status: 422 });
  }

  // Insert member
  const { data: member, error } = await supabase
    .from('members')
    .insert({
      wallet_address:   wallet_address.toLowerCase(),
      payment_tx_hash:  tx_hash,
      payment_amount:   '2.00',
      payment_currency: 'USDC',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Already a member — return existing
      const { data: existingMember } = await supabase
        .from('members')
        .select('*')
        .eq('wallet_address', wallet_address.toLowerCase())
        .single();
      return NextResponse.json({ member: existingMember }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ member }, { status: 201 });
}
