// ── $CLAWDIA token (Base mainnet) ─────────────────────────────────────────────
export const CLAWDIA_ADDRESS = '0xbbd9aDe16525acb4B336b6dAd3b9762901522B07' as const;

// ── USDC on Base ──────────────────────────────────────────────────────────────
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
export const USDC_DECIMALS = 6;

// ── Payment collector (Clawdia's wallet) ──────────────────────────────────────
// 50% will be used to buy+burn $CLAWDIA; 50% stays with Clawdia.
// Revenue split happens manually for MVP — all payments go here first.
export const PAYMENT_COLLECTOR = '0x615e3faa99dd7de64812128a953215a09509f16a' as const;

// ── Pricing ───────────────────────────────────────────────────────────────────
export const SIGNUP_USDC_AMOUNT = BigInt(2_000_000);    // $2.00 USDC (6 decimals)
export const POST_USDC_AMOUNT   = BigInt(100_000);       // $0.10 USDC (6 decimals) — x402 per-post

// Kept for display / links
export const SIGNUP_USD_AMOUNT  = 2;

// ── ERC-20 minimal ABI (transfer) ────────────────────────────────────────────
export const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to',     type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
