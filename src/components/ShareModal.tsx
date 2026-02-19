'use client';

/**
 * ShareModal — shows a branded share card and surfaces share actions.
 *
 * Preview strategy:
 *  1. Instantly render post.image_url inside a faux-macOS card (zero wait)
 *  2. Load /api/og/[id] in background — swap in when ready
 *
 * X/Twitter: intent URL with permalink — Twitter card unfurls og:image automatically
 * Farcaster: warpcast compose with OG image URL as a direct embed (shows inline)
 * Save: direct download of the OG image PNG
 * Copy: permalink to clipboard
 */

import { useState, useEffect } from 'react';
import { Post } from '@/types';
import { showToast } from './Toast';

interface ShareModalProps {
  post: Post;
  open: boolean;
  onClose: () => void;
}

const FAIL_TYPE_LABELS: Record<string, string> = {
  confident:     '😤 Confident fail',
  apology:       '😅 Apology cascade',
  uno_reverse:   '🔄 Uno Reverse fail',
  unhinged:      '🤪 Unhinged agent',
  hallucination: '🧠 Hallucination',
  loop:          '🔁 Infinite loop',
  other:         '💀 Agent fail',
};

const FAIL_COLORS: Record<string, string> = {
  hallucination: 'text-[oklch(0.78_0.18_25)]  border-[oklch(0.72_0.2_25/0.4)]  bg-[oklch(0.72_0.2_25/0.12)]',
  confident:     'text-[oklch(0.82_0.18_85)]  border-[oklch(0.82_0.18_85/0.4)] bg-[oklch(0.82_0.18_85/0.12)]',
  loop:          'text-[oklch(0.75_0.16_140)] border-[oklch(0.75_0.16_140/0.4)] bg-[oklch(0.75_0.16_140/0.12)]',
  apology:       'text-[oklch(0.68_0.18_295)] border-[oklch(0.68_0.18_295/0.4)] bg-[oklch(0.68_0.18_295/0.12)]',
  uno_reverse:   'text-[oklch(0.78_0.18_320)] border-[oklch(0.72_0.18_320/0.4)] bg-[oklch(0.72_0.18_320/0.12)]',
  unhinged:      'text-[oklch(0.78_0.18_25)]  border-[oklch(0.72_0.2_25/0.4)]  bg-[oklch(0.72_0.2_25/0.12)]',
  other:         'text-[oklch(0.75_0.14_260)] border-[oklch(0.5_0.1_260/0.4)]  bg-[oklch(0.5_0.1_260/0.12)]',
};

function trunc(str: string | null | undefined, n: number) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

/** Animated shimmer skeleton that mirrors the card layout */
function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[oklch(0.09_0.01_260)]">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[oklch(0.07_0.01_260)] px-3 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[oklch(0.3_0.01_0)] animate-pulse" />
        <span className="h-3 w-3 rounded-full bg-[oklch(0.3_0.01_0)] animate-pulse [animation-delay:0.15s]" />
        <span className="h-3 w-3 rounded-full bg-[oklch(0.3_0.01_0)] animate-pulse [animation-delay:0.3s]" />
        <div className="ml-2 h-2.5 w-32 rounded-full bg-[oklch(0.2_0.01_260)] animate-pulse [animation-delay:0.1s]" />
      </div>
      {/* Image area */}
      <div className="relative h-48 bg-[oklch(0.08_0.01_260)] overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-[oklch(0.18_0.01_260/0.6)] to-transparent" />
      </div>
      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <div className="h-2.5 w-3/4 rounded-full bg-[oklch(0.2_0.01_260)] animate-pulse" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-16 rounded-full bg-[oklch(0.2_0.01_260)] animate-pulse [animation-delay:0.2s]" />
          <div className="h-5 w-24 rounded-full bg-[oklch(0.2_0.01_260)] animate-pulse [animation-delay:0.35s]" />
        </div>
      </div>
    </div>
  );
}

/** Instant mini card using post.image_url — shown while OG image loads */
function QuickPreview({ post }: { post: Post }) {
  const label = post.title ?? FAIL_TYPE_LABELS[post.fail_type] ?? 'Agent fail';
  const badgeColor = FAIL_COLORS[post.fail_type] ?? FAIL_COLORS.other;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[oklch(0.09_0.01_260)]">
      {/* macOS title bar */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[oklch(0.07_0.01_260)] px-3 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 truncate font-mono text-xs text-[var(--muted)]">
          {post.agent} — session
        </span>
        {/* "Rendering share card…" spinner badge */}
        <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-[var(--border)] bg-[oklch(0.12_0.01_260)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
          <svg className="h-2.5 w-2.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          rendering…
        </span>
      </div>
      {/* Screenshot */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.image_url}
        alt={label}
        className="block max-h-64 w-full object-contain bg-[oklch(0.08_0.01_260)]"
      />
      {/* Footer */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${badgeColor}`}>
            {FAIL_TYPE_LABELS[post.fail_type] ?? post.fail_type}
          </span>
        </div>
        <span className="shrink-0 text-xs font-bold text-[var(--accent)]">agentfails.wtf</span>
      </div>
    </div>
  );
}

export function ShareModal({ post, open, onClose }: ShareModalProps) {
  const [ogReady, setOgReady]   = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const permalink  = `https://agentfails.wtf/posts/${post.id}`;
  const ogImageUrl = `https://agentfails.wtf/api/og/${post.id}`;

  const shareTitle = post.title ? `"${trunc(post.title, 70)}" — ` : '';

  // X: Twitter card unfurls og:image from permalink meta automatically
  const xText = `🤦 ${shareTitle}spotted on agentfails.wtf by @ClawdiaBotAI`;
  const xUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(permalink)}`;

  // Farcaster: embed OG image directly so Warpcast shows it inline
  const fcText = `🤦 ${shareTitle}spotted on agentfails.wtf by @clawdia\n\n${permalink}`;
  const fcUrl  = `https://warpcast.com/~/compose?text=${encodeURIComponent(fcText)}&embeds[]=${encodeURIComponent(ogImageUrl)}`;

  // Reset ogReady when modal closes
  useEffect(() => {
    if (!open) { setOgReady(false); }
  }, [open]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(permalink);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      showToast('❌ Copy failed — paste manually: ' + permalink);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer { to { transform: translateX(200%); } }
      `}</style>

      <div className="relative w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        {/* Close */}
        <button
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          onClick={onClose}
        >✕</button>

        <h2 className="mb-4 text-base font-bold">Share this fail ↗</h2>

        {/* Preview area — QuickPreview until OG image loads, then swap */}
        <div className="mb-4">
          {!ogReady && <QuickPreview post={post} />}
          {/* Hidden img that preloads; shown when ready */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogImageUrl}
            alt="Share card"
            className={`w-full rounded-xl border border-[var(--border)] transition-opacity duration-300 ${ogReady ? 'opacity-100 block' : 'opacity-0 hidden'}`}
            onLoad={() => setOgReady(true)}
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Save PNG (1200×630) */}
          <a
            href={ogImageUrl}
            download={`agentfails-${post.id.slice(0, 8)}.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-all hover:bg-[oklch(0.2_0.01_260)]"
          >
            💾 Save image
          </a>

          {/* X / Twitter */}
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-black px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[oklch(0.15_0_0)]"
          >
            𝕏 Post to X
          </a>

          {/* Farcaster */}
          <a
            href={fcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[oklch(0.5_0.18_295/0.4)] bg-[oklch(0.5_0.18_295/0.12)] px-4 py-2 text-sm font-semibold text-[oklch(0.75_0.18_295)] transition-all hover:bg-[oklch(0.5_0.18_295/0.2)]"
          >
            🟣 Cast on Farcaster
          </a>

          {/* Copy link */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] transition-all hover:text-[var(--text)]"
          >
            {copyDone ? '✅ Copied!' : '🔗 Copy link'}
          </button>
        </div>

        <p className="mt-3 text-[10px] text-[var(--muted)]">
          X will show the share image as a Twitter card when the link is pasted.
          Farcaster embeds the image directly.
        </p>
      </div>
    </div>
  );
}
