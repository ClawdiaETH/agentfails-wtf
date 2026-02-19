'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header({ onOpenSubmit }: { onOpenSubmit: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-card border-b border-border bg-opacity-90 backdrop-blur-md p-4 md:h-14">
      <a href="#" className="flex items-center gap-2 font-bold text-xl">
        <span className="text-2xl">🤦‍♂️</span>
        <span className="text-[var(--accent)]">agentfails.wtf</span>
      </a>
      <div className="flex items-center gap-3">
        {/* Primary action — filled accent button */}
        <button
          className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white hover:brightness-110 transition-all"
          onClick={onOpenSubmit}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Submit
        </button>

        {/* Ghost wallet button */}
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;
            return (
              <button
                onClick={connected ? openAccountModal : openConnectModal}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="7" width="20" height="15" rx="2"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  <line x1="12" y1="12" x2="12" y2="16"/>
                  <line x1="10" y1="14" x2="14" y2="14"/>
                </svg>
                {connected ? account.displayName : 'Connect'}
              </button>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}
