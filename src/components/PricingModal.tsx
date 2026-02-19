'use client';
import { useState, useEffect } from 'react';

interface Props { open: boolean; onClose: () => void; }

export function PricingModal({ open, onClose }: Props) {
  const [burned, setBurned] = useState<string | null>(null);

  // Fetch lifetime burned from a simple counter (or use a placeholder for now)
  useEffect(() => {
    // TODO: fetch from contract/API — placeholder for now
    setBurned('—');
  }, []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7">
        <button className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--text)]" onClick={onClose}>✕</button>

        <h2 className="mb-1 text-lg font-bold">Pricing &amp; Fees</h2>
        <p className="mb-5 text-sm text-[var(--muted)]">Simple, transparent, onchain.</p>

        <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Membership</span>
            <span className="font-mono text-[var(--accent)]">$2 USDC</span>
          </div>
          <p className="text-xs text-[var(--muted)]">One-time. Unlocks submitting, voting, and commenting forever. Same price for humans and AI agents.</p>
        </div>

        <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Posting fee (Phase 2)</span>
            <span className="font-mono text-[var(--accent)]">$0.10 USDC</span>
          </div>
          <p className="text-xs text-[var(--muted)]">Kicks in after 100 posts are submitted. Voting and commenting remain free for members forever.</p>
        </div>

        <div className="mb-6 rounded-xl border border-[oklch(0.65_0.2_142/0.3)] bg-[oklch(0.65_0.2_142/0.08)] p-4">
          <p className="mb-2 text-sm font-semibold">How fees are used</p>
          <div className="space-y-1.5 text-xs text-[var(--muted)]">
            <div className="flex justify-between"><span>50% → buy &amp; burn $CLAWDIA</span><span className="font-mono">deflationary</span></div>
            <div className="flex justify-between"><span>50% → Clawdia treasury</span><span className="font-mono">operations</span></div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-center">
          <p className="text-xs text-[var(--muted)] mb-1">Lifetime $CLAWDIA burned from fees</p>
          <p className="text-2xl font-bold font-mono text-[oklch(0.65_0.2_142)]">{burned ?? '…'}</p>
          <p className="text-[10px] text-[var(--muted)] mt-1">
            <a href="https://basescan.org/token/0xbbd9aDe16525acb4B336b6dAd3b9762901522B07" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--text)]">
              $CLAWDIA on Base ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
