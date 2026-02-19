/**
 * GET /api/og/[id] — Branded OG share image for a post.
 *
 * Fixed three-section layout regardless of screenshot dimensions:
 *   Title bar : 52px
 *   Screenshot: 488px  (image contained + letterboxed)
 *   Footer    : 90px
 *   ──────────────────
 *   Total     : 630px  (standard 1200×630 OG)
 *
 * ?hq=1  →  2400×1260 high-quality version for download
 *
 * Fonts: Space Grotesk loaded from Google Fonts (cached in module scope).
 */

import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// ── Font loading (cached across requests) ────────────────────────────────────

let fontRegular: ArrayBuffer | null = null;
let fontBold:    ArrayBuffer | null = null;

async function loadGoogleFont(weight: 400 | 700): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@${weight}&display=swap`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' } },
    ).then(r => r.text());

    const url = css.match(/url\((.+?\.woff2)\)/)?.[1];
    if (!url) return null;
    return fetch(url).then(r => r.arrayBuffer());
  } catch {
    return null;
  }
}

async function getFonts() {
  if (!fontRegular) fontRegular = await loadGoogleFont(400);
  if (!fontBold)    fontBold    = await loadGoogleFont(700);

  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }[] = [];
  if (fontRegular) fonts.push({ name: 'Space Grotesk', data: fontRegular, weight: 400, style: 'normal' });
  if (fontBold)    fonts.push({ name: 'Space Grotesk', data: fontBold,    weight: 700, style: 'normal' });
  return fonts;
}

// ── Constants ─────────────────────────────────────────────────────────────────

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

const FAIL_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  hallucination: { bg: 'rgba(220,60,40,0.2)',  color: '#e87060', border: 'rgba(220,60,40,0.45)'  },
  confident:     { bg: 'rgba(200,160,30,0.2)', color: '#d4aa30', border: 'rgba(200,160,30,0.45)' },
  loop:          { bg: 'rgba(50,180,100,0.2)', color: '#50c878', border: 'rgba(50,180,100,0.45)' },
  apology:       { bg: 'rgba(120,60,220,0.2)', color: '#a070e8', border: 'rgba(120,60,220,0.45)' },
  uno_reverse:   { bg: 'rgba(180,50,180,0.2)', color: '#d060d0', border: 'rgba(180,50,180,0.45)' },
  unhinged:      { bg: 'rgba(220,60,40,0.2)',  color: '#e87060', border: 'rgba(220,60,40,0.45)'  },
  other:         { bg: 'rgba(80,80,100,0.2)',  color: '#9090b0', border: 'rgba(80,80,100,0.45)'  },
};

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const hq = req.nextUrl.searchParams.has('hq');

  // Scale everything by 2 for HQ download
  const scale      = hq ? 2 : 1;
  const W          = 1200 * scale;
  const H          = 630  * scale;
  const TITLEBAR_H = 52   * scale;
  const IMG_H      = 488  * scale;
  const FOOTER_H   = 90   * scale;

  const { data: post } = await getSupabaseAdmin()
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (!post) return new Response('Post not found', { status: 404 });

  const failLabel  = FAIL_LABELS[post.fail_type]  ?? post.fail_type;
  const agentLabel = AGENT_LABELS[post.agent]      ?? post.agent;
  const badge      = FAIL_BADGE[post.fail_type]    ?? FAIL_BADGE.other;
  const title      = post.title ?? '';

  const fonts = await getFonts();
  const fontFamily = fonts.length > 0 ? 'Space Grotesk' : 'ui-sans-serif, system-ui, sans-serif';

  return new ImageResponse(
    (
      <div
        style={{
          display:       'flex',
          flexDirection: 'column',
          width:         W,
          height:        H,
          background:    '#0d0d12',
          fontFamily,
          overflow:      'hidden',
        }}
      >
        {/* ── Title bar ── */}
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            width:        W,
            height:       TITLEBAR_H,
            flexShrink:   0,
            background:   '#080810',
            borderBottom: '1px solid #1e1e2e',
            padding:      `0 ${20 * scale}px`,
            gap:          8 * scale,
          }}
        >
          <div style={{ width: 13 * scale, height: 13 * scale, borderRadius: 999, background: '#ff5f57' }} />
          <div style={{ width: 13 * scale, height: 13 * scale, borderRadius: 999, background: '#ffbd2e', marginLeft: 5 * scale }} />
          <div style={{ width: 13 * scale, height: 13 * scale, borderRadius: 999, background: '#28c840', marginLeft: 5 * scale }} />
          <span
            style={{
              marginLeft:   12 * scale,
              color:        '#666',
              fontSize:     15 * scale,
              fontFamily:   'monospace',
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {agentLabel} — session
          </span>
        </div>

        {/* ── Screenshot ── */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          W,
            height:         IMG_H,
            flexShrink:     0,
            background:     '#111118',
            overflow:       'hidden',
          }}
        >
          {post.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.image_url}
              alt=""
              style={{ width: W, height: IMG_H, objectFit: 'contain' }}
            />
          ) : (
            <span style={{ color: '#333', fontSize: 48 * scale }}>🤦</span>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            width:          W,
            height:         FOOTER_H,
            flexShrink:     0,
            background:     '#0d0d12',
            borderTop:      '1px solid #1e1e2e',
            padding:        `0 ${24 * scale}px`,
          }}
        >
          {/* Left: title + badges */}
          <div
            style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           8 * scale,
              flex:          1,
              minWidth:      0,
              overflow:      'hidden',
            }}
          >
            {title ? (
              <span
                style={{
                  color:        '#f0f0f0',
                  fontWeight:   700,
                  fontSize:     17 * scale,
                  whiteSpace:   'nowrap',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </span>
            ) : null}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 * scale }}>
              <span
                style={{
                  background:   badge.bg,
                  color:        badge.color,
                  border:       `1px solid ${badge.border}`,
                  borderRadius: 999,
                  padding:      `${4 * scale}px ${12 * scale}px`,
                  fontSize:     12 * scale,
                  fontWeight:   700,
                  whiteSpace:   'nowrap',
                }}
              >
                {failLabel}
              </span>
              <span
                style={{
                  background:   'rgba(255,255,255,0.05)',
                  color:        '#777',
                  border:       '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 999,
                  padding:      `${4 * scale}px ${12 * scale}px`,
                  fontSize:     12 * scale,
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
              gap:        8 * scale,
              flexShrink: 0,
              marginLeft: 32 * scale,
            }}
          >
            <span style={{ fontSize: 24 * scale }}>🧑‍💻</span>
            <span style={{ color: '#ff6b35', fontWeight: 800, fontSize: 22 * scale, fontFamily }}>
              agentfails.wtf
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width:  W,
      height: H,
      fonts,
    },
  );
}
