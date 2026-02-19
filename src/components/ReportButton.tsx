'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from './Toast';

interface ReportButtonProps {
  postId: string;
  reporterWallet: string | undefined;
  /** iconOnly: shows just the flag icon (used in title bar) */
  iconOnly?: boolean;
}

export function ReportButton({ postId, reporterWallet, iconOnly }: ReportButtonProps) {
  const [reported, setReported] = useState(false);

  async function handleReport() {
    if (!reporterWallet) { showToast('Connect wallet to report'); return; }
    if (reported) return;
    await supabase.from('reports').insert({ post_id: postId, reporter_wallet: reporterWallet });
    setReported(true);
    showToast('🚩 Reported — thanks');
  }

  if (iconOnly) {
    return (
      <button
        onClick={e => { e.stopPropagation(); handleReport(); }}
        className={`flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors ${
          reported ? 'text-[var(--accent)]' : 'text-[oklch(0.4_0.01_260)] hover:text-[var(--muted)]'
        }`}
        title={reported ? 'Reported' : 'Report this post'}
      >
        {reported ? '🚩' : '⚑'}
      </button>
    );
  }

  return (
    <button
      onClick={handleReport}
      className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
      title="Report this post"
    >
      {reported ? '🚩 reported' : '⚑ report'}
    </button>
  );
}
