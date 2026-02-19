/**
 * GET /api/anons-check?wallet=0x...
 *
 * Checks whether a wallet holds an Anon NFT v2 on Base mainnet.
 * Uses viem to call balanceOf(address) on the ERC-721 contract.
 *
 * Response: { isHolder: boolean, balance: number }
 * Cached for 60s via Vercel CDN.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, isAddress } from 'viem';
import { base } from 'viem/chains';

const ANONS_NFT_V2 = '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686' as const;

const BALANCE_OF_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

function getPublicClient() {
  const rpcUrl =
    process.env.NEXT_PUBLIC_BASE_RPC_URL ??
    process.env.BASE_RPC_URL ??
    'https://mainnet.base.org';

  return createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');

  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json(
      { error: 'wallet query param must be a valid 0x address' },
      { status: 400 },
    );
  }

  try {
    const client = getPublicClient();
    const rawBalance = await client.readContract({
      address: ANONS_NFT_V2,
      abi: BALANCE_OF_ABI,
      functionName: 'balanceOf',
      args: [wallet as `0x${string}`],
    });

    const balance = Number(rawBalance);
    return NextResponse.json(
      { isHolder: balance > 0, balance },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60',
        },
      },
    );
  } catch (err) {
    console.error('[anons-check] RPC error:', err);
    return NextResponse.json(
      { error: 'Failed to check NFT balance' },
      { status: 500 },
    );
  }
}
