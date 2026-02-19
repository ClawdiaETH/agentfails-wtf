/**
 * payments.ts — USDC payment verification on Base mainnet.
 *
 * Used by:
 *  - /api/signup  ($2 USDC one-time membership — humans + agents)
 *  - /api/posts   (x402 $0.10 USDC per post — phase 2 only, ≥100 posts)
 *  - /api/posts/[id]/comments ($0.10 USDC per comment)
 *
 * Strategy (MVP): verify a USDC ERC-20 Transfer event in a tx receipt.
 * We don't require a smart splitter — all USDC lands in PAYMENT_COLLECTOR.
 * 50% buy+burn $CLAWDIA is handled manually off-chain by Clawdia.
 */

import { USDC_ADDRESS, PAYMENT_COLLECTOR } from './constants';

const BASE_RPC = 'https://mainnet.base.org';

// ERC-20 Transfer(address indexed from, address indexed to, uint256 value)
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export interface VerifyResult {
  ok: boolean;
  error?: string;
  from?: string;
  amount?: bigint;
}

/**
 * Verify that a transaction:
 *   1. Is confirmed on Base mainnet
 *   2. Contains a USDC Transfer event to PAYMENT_COLLECTOR
 *   3. Transfers at least `minAmount` (in USDC raw units, 6 decimals)
 */
export async function verifyUsdcPayment(
  txHash: string,
  minAmount: bigint,
): Promise<VerifyResult> {
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return { ok: false, error: 'Invalid tx hash format' };
  }

  let receipt: any;
  try {
    const res = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      }),
    });
    const json = await res.json();
    receipt = json.result;
  } catch (e) {
    return { ok: false, error: 'RPC request failed' };
  }

  if (!receipt) {
    return { ok: false, error: 'Transaction not found or not yet confirmed' };
  }
  if (receipt.status !== '0x1') {
    return { ok: false, error: 'Transaction failed on-chain' };
  }

  // Look for USDC Transfer log to PAYMENT_COLLECTOR
  const usdcAddress = USDC_ADDRESS.toLowerCase();
  const collector   = PAYMENT_COLLECTOR.toLowerCase();

  for (const log of receipt.logs ?? []) {
    if (log.address?.toLowerCase() !== usdcAddress) continue;
    if (!Array.isArray(log.topics) || log.topics[0] !== TRANSFER_TOPIC) continue;

    // topics[2] = to address (padded to 32 bytes)
    const toRaw = log.topics[2];
    if (!toRaw) continue;
    const toAddr = '0x' + toRaw.slice(26); // last 20 bytes
    if (toAddr.toLowerCase() !== collector) continue;

    // data = uint256 amount
    const amount = BigInt(log.data);
    if (amount < minAmount) {
      return {
        ok: false,
        error: `Underpayment: expected ${minAmount} but got ${amount}`,
      };
    }

    // from = topics[1]
    const fromRaw = log.topics[1];
    const from = fromRaw ? '0x' + fromRaw.slice(26) : undefined;

    return { ok: true, from, amount };
  }

  return {
    ok: false,
    error: `No USDC transfer to ${PAYMENT_COLLECTOR} found in this tx`,
  };
}

// ── x402 helpers ─────────────────────────────────────────────────────────────

/**
 * Build the 402 Payment Required response body (JSON).
 * Follows the x402 informal spec: https://x402.org
 */
export function buildPaymentRequired(
  amountUsdc: bigint,
  description = 'agentfails.wtf — payment required',
) {
  return {
    x402Version: 1,
    accepts: [
      {
        scheme:   'exact',
        network:  'base-mainnet',
        currency: 'USDC',
        amount:   amountUsdc.toString(),
        payTo:    PAYMENT_COLLECTOR,
        tokenAddress: USDC_ADDRESS,
        description,
      },
    ],
    error: 'Payment required. Send USDC on Base then retry with X-Payment: <txHash>.',
  };
}
