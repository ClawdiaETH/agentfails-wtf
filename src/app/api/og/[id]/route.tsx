/**
 * GET /api/og/[id] — Server-side OG image for a post.
 *
 * Uses next/og (Satori) to render a branded share card as PNG.
 * Powers:
 *  - og:image on /posts/[id] permalink pages (Twitter/X card, Farcaster unfurl)
 *  - Direct embed URL for Farcaster warpcast compose
 *  - Download target in ShareModal ("Save image")
 *
 * Dimensions: 1200×630 (standard OG / Twitter card)
 */

import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const FAIL_LABELS: Record<string, string> = {
  hallucination: '🏜️ Hallucination',
  confident:     '🫡 Confidently Wrong',
  loop:          '♾️ Infinite Loop',
  apology:       '🙏 Apology Loop',
  uno_reverse:   '🔄 Uno Reverse',
  unhinged:      '🤪 Just Unhinged',
  other:         '🤷 Other',
};

const AGENT_LABELS: Record<string, string> = {
  openclaw: '🦞 OpenClaw',
  claude:   '🤖 Claude',
  chatgpt:  '💚 ChatGPT',
  gemini:   '💙 Gemini',
  grok:     '🦅 Grok',
  other:    '🤖 Other AI',
};

// ── Badge colours (Satori-safe — no oklch) ───────────────────────────────────
const FAIL_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  hallucination: { bg: 'rgba(220,60,40,0.15)',  color: '#e87060', border: 'rgba(220,60,40,0.4)'  },
  confident:     { bg: 'rgba(200,160,30,0.15)', color: '#d4aa30', border: 'rgba(200,160,30,0.4)' },
  loop:          { bg: 'rgba(50,180,100,0.15)', color: '#50c878', border: 'rgba(50,180,100,0.4)' },
  apology:       { bg: 'rgba(120,60,220,0.15)', color: '#a070e8', border: 'rgba(120,60,220,0.4)' },
  uno_reverse:   { bg: 'rgba(180,50,180,0.15)', color: '#d060d0', border: 'rgba(180,50,180,0.4)' },
  unhinged:      { bg: 'rgba(220,60,40,0.15)',  color: '#e87060', border: 'rgba(220,60,40,0.4)'  },
  other:         { bg: 'rgba(80,80,100,0.15)',  color: '#9090b0', border: 'rgba(80,80,100,0.4)'  },
};

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data: post } = await getSupabaseAdmin()
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (!post) {
    return new Response('Post not found', { status: 404 });
  }

  const failLabel  = FAIL_LABELS[post.fail_type]  ?? post.fail_type;
  const agentLabel = AGENT_LABELS[post.agent]      ?? post.agent;
  const badge      = FAIL_BADGE[post.fail_type]    ?? FAIL_BADGE.other;
  const title      = post.title ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          display:        'flex',
          flexDirection:  'column',
          width:          '100%',
          height:         '100%',
          background:     '#0d0d12',
          fontFamily:     'ui-sans-serif, system-ui, -apple-system, sans-serif',
          overflow:       'hidden',
        }}
      >
        {/* ── Faux-macOS title bar ─────────────────────────────────────── */}
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          8,
            background:   '#080810',
            padding:      '14px 20px',
            borderBottom: '1px solid #1e1e2e',
            flexShrink:   0,
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ffbd2e', marginLeft: 6 }} />
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#28c840', marginLeft: 6 }} />
          <span style={{ marginLeft: 12, color: '#666', fontSize: 15, fontFamily: 'monospace' }}>
            {agentLabel} — session
          </span>
        </div>

        {/* ── Screenshot ───────────────────────────────────────────────── */}
        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_url}
            alt=""
            style={{
              flex:       1,
              width:      '100%',
              objectFit:  'contain',
              background: '#111118',
              minHeight:  0,
            }}
          />
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '16px 20px',
            background:     '#0d0d12',
            borderTop:      '1px solid #1e1e2e',
            flexShrink:     0,
          }}
        >
          {/* Left: title + badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
            {title ? (
              <span style={{ color: '#f0f0f0', fontWeight: 700, fontSize: 18, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title}
              </span>
            ) : null}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Fail type badge */}
              <span
                style={{
                  background:   badge.bg,
                  color:        badge.color,
                  border:       `1px solid ${badge.border}`,
                  borderRadius: 999,
                  padding:      '3px 10px',
                  fontSize:     12,
                  fontWeight:   700,
                  whiteSpace:   'nowrap',
                }}
              >
                {failLabel}
              </span>
              {/* Agent badge */}
              <span
                style={{
                  background:   'rgba(255,255,255,0.05)',
                  color:        '#888',
                  border:       '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 999,
                  padding:      '3px 10px',
                  fontSize:     12,
                  whiteSpace:   'nowrap',
                }}
              >
                {agentLabel}
              </span>
            </div>
          </div>

          {/* Right: branding */}
          <div
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        8,
              flexShrink: 0,
              marginLeft: 24,
            }}
          >
            <span style={{ fontSize: 22 }}>🧑‍💻</span>
            <span style={{ color: '#ff6b35', fontWeight: 800, fontSize: 20 }}>
              agentfails.wtf
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
    },
  );
}
