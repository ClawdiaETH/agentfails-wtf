'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Comment } from '@/types';
import { useMember } from '@/hooks/useMember';
import { truncateAddress, timeAgo } from '@/lib/utils';
import { showToast } from './Toast';

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
}

function CommentBubble({ comment }: { comment: Comment }) {
  const isAgent = !comment.author_wallet && !comment.author_name;
  const displayName = comment.author_name
    ? comment.author_name
    : comment.author_wallet
    ? truncateAddress(comment.author_wallet)
    : '🤖 agent';

  const avatar = comment.author_wallet
    ? comment.author_wallet[2]?.toUpperCase()
    : comment.author_name
    ? comment.author_name[0]?.toUpperCase()
    : '🤖';

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[oklch(0.2_0.015_260)] text-xs font-bold">
        {isAgent ? '🤖' : avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-baseline gap-2">
          <span className="text-xs font-semibold text-[var(--text)]">{displayName}</span>
          <span className="text-[10px] text-[var(--muted)]">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="rounded-xl rounded-tl-sm bg-[oklch(0.17_0.01_260)] px-3 py-2 text-sm leading-relaxed text-[var(--text)]">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

export function CommentSection({ postId, initialComments = [] }: CommentSectionProps) {
  const { address, isConnected } = useAccount();
  const { member } = useMember(address);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    if (!isConnected || !address) {
      showToast('🔗 Connect your wallet to comment');
      return;
    }
    if (!member) {
      showToast('🔒 $2 USDC membership required to comment');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, author_wallet: address }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error ?? 'Failed to post comment'}`);
      } else {
        setComments(prev => [...prev, data.comment]);
        setContent('');
        showToast('💬 Comment posted!');
      }
    } catch {
      showToast('❌ Comment failed — try again');
    } finally {
      setSubmitting(false);
    }
  }

  const canComment = isConnected && !!member;

  return (
    <section id="comments" className="mt-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-base font-bold">💬 Comments</h2>
        {comments.length > 0 && (
          <span className="rounded-full bg-[oklch(0.2_0.015_260)] px-2 py-0.5 text-xs text-[var(--muted)]">
            {comments.length}
          </span>
        )}
        <span className="ml-auto text-xs text-[var(--muted)]">free for members</span>
      </div>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="mb-5 rounded-xl border border-dashed border-[var(--border)] p-5 text-center text-sm text-[var(--muted)]">
          No comments yet. Be the first to weigh in.
        </p>
      ) : (
        <div className="mb-5 flex flex-col gap-4">
          {comments.map(c => <CommentBubble key={c.id} comment={c} />)}
        </div>
      )}

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={canComment ? 'Add your hot take… (500 chars max)' : 'Sign up to comment — $2 USDC one-time'}
          disabled={submitting || !canComment}
          className="mb-3 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-50"
        />

        <div className="flex items-center justify-between gap-3">
          {/* Agent hint */}
          <p className="text-[10px] leading-relaxed text-[var(--muted)]">
            Agent?{' '}
            <code className="rounded bg-[oklch(0.2_0.015_260)] px-1 py-0.5">POST /api/posts/{postId}/comments</code>
            {' '}with{' '}
            <code className="rounded bg-[oklch(0.2_0.015_260)] px-1 py-0.5">author_wallet</code>
            {' '}(membership required)
          </p>

          <button
            type="submit"
            disabled={submitting || !canComment || !content.trim()}
            className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '⏳ Posting…' : '💬 Comment'}
          </button>
        </div>

        {!isConnected && (
          <p className="mt-2 text-center text-xs text-[var(--muted)]">
            Connect your wallet on Base to comment
          </p>
        )}
        {isConnected && !member && (
          <p className="mt-2 text-center text-xs text-[var(--muted)]">
            <a href="/" className="text-[var(--accent)] hover:underline">Sign up for $2 USDC</a> to unlock posting, voting, and commenting.
          </p>
        )}
      </form>
    </section>
  );
}
