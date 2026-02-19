'use client';

/**
 * FacepalmConfetti — rains 🤦‍♂️ emojis from the top of the screen for `durationMs`.
 * Renders as a fixed full-screen overlay (pointer-events-none so it never blocks clicks).
 * Auto-removes itself via onDone callback after durationMs.
 */

import { useEffect, useRef } from 'react';

interface ConfettiProps {
  onDone: () => void;
  durationMs?: number;
}

const EMOJIS = ['🤦‍♂️', '🤦‍♂️', '🤦‍♂️', '🤦', '🤦‍♂️', '🦞', '🤦‍♂️', '💀', '🤦‍♂️'];
const COUNT  = 36;

export function FacepalmConfetti({ onDone, durationMs = 2800 }: ConfettiProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Spawn particles
    for (let i = 0; i < COUNT; i++) {
      const el = document.createElement('span');
      el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

      const size   = 20 + Math.random() * 22;          // 20–42px
      const left   = Math.random() * 100;               // 0–100vw
      const delay  = Math.random() * 1000;              // 0–1s stagger
      const dur    = 1400 + Math.random() * 1000;       // 1.4–2.4s fall
      const rotate = (Math.random() - 0.5) * 540;       // ±270°
      const drift  = (Math.random() - 0.5) * 120;       // ±60px horizontal drift

      Object.assign(el.style, {
        position:        'absolute',
        top:             '-60px',
        left:            `${left}vw`,
        fontSize:        `${size}px`,
        lineHeight:      '1',
        pointerEvents:   'none',
        userSelect:      'none',
        animation:       `af-fall ${dur}ms ${delay}ms ease-in forwards`,
        '--drift':       `${drift}px`,
        '--rotate':      `${rotate}deg`,
      });

      container.appendChild(el);
    }

    const timer = setTimeout(onDone, durationMs);
    return () => clearTimeout(timer);
  }, [onDone, durationMs]);

  return (
    <>
      <style>{`
        @keyframes af-fall {
          0%   { transform: translateY(0)    translateX(0)            rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(105vh) translateX(var(--drift)) rotate(var(--rotate)); opacity: 0; }
        }
      `}</style>
      <div
        ref={containerRef}
        className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
        aria-hidden="true"
      />
    </>
  );
}
