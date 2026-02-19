'use client';

/**
 * ShareModal — shows a branded share card and surfaces share actions.
 *
 * Preview uses /api/og/[id] — server-side Satori rendering, no CORS issues,
 * no html-to-image font-metric weirdness.
 *
 * X/Twitter: intent URL with permalink — Twitter card unfurls og:image automatically
 * Farcaster: warpcast compose with OG image URL as a direct embed (shows inline)
 * Save: direct download of the OG image PNG
 * Copy: permalink to clipboard
 */

import { useState } from 'react';
import { Post } from '@/types';
import { showToast } from './Toast';

interface ShareModalProps {
  post: Post;
  open: boolean;
  onClose: () => void;
}

function trunc(str: string | null | undefined, n: number) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

export function ShareModal({ post, open, onClose }: ShareModalProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const permalink = `https://agentfails.wtf/posts/${post.id}`;
  const ogImageUrl = `https://agentfails.wtf/api/og/${post.id}`;

  const shareText = post.title
    ? `🤦 "${trunc(post.title, 80)}" — spotted on @agentfailswtf`
    : `🤦 spotted on @agentfailswtf`;

  // X: just permalink — Twitter card unfurls og:image from the permalink's meta tags
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(permalink)}`;

  // Farcaster: embed the OG image URL directly so Warpcast shows it inline
  const fcUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText + '\n\n' + permalink)}&embeds[]=${encodeURIComponent(ogImageUrl)}`;

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
      <div className="relative w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        {/* Close */}
        <button
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          onClick={onClose}
        >✕</button>

        <h2 className="mb-4 text-base font-bold">Share this fail ↗</h2>

        {/* OG image preview — rendered server-side, no CORS issues */}
        <div className="mb-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[oklch(0.09_0.01_260)]">
          {!imgLoaded && (
            <div className="flex h-40 items-center justify-center text-sm text-[var(--muted)]">
              ⏳ Loading…
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogImageUrl}
            alt="Share card preview"
            className={`w-full rounded-xl transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0 h-0'}`}
            onLoad={() => setImgLoaded(true)}
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Save — download the OG PNG */}
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
