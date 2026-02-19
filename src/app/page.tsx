'use client';

import { useState } from 'react';
import { queryClient } from '@/lib/queryClient';
import { Header } from '@/components/Header';
import { TabBar } from '@/components/TabBar';
import { StatsBar } from '@/components/StatsBar';
import { PostFeed } from '@/components/PostFeed';
import { WalletModal } from '@/components/WalletModal';
import { SubmitModal } from '@/components/SubmitModal';
import { PricingModal } from '@/components/PricingModal';
import { Toast } from '@/components/Toast';
import { Tab } from '@/hooks/usePosts';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('hot');
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  function handleSubmitClick() {
    setSubmitModalOpen(true);
  }

  function handleNeedSignup() {
    setSubmitModalOpen(false);
    setWalletModalOpen(true);
  }

  function handleJoined() {
    // Refresh member status — re-open submit if they came via submit flow
    setSubmitModalOpen(true);
  }

  function handleSubmitted() {
    // Switch to New tab and refetch
    setActiveTab('new');
    void queryClient.invalidateQueries({ queryKey: ['posts'] });
  }

  return (
    <>
      <Header onOpenSubmit={handleSubmitClick} />

      <nav>
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
      </nav>

      <main className="mx-auto flex max-w-[680px] flex-col gap-4 px-4 py-5">
        <StatsBar />
        <PostFeed activeTab={activeTab} onNeedSignup={handleNeedSignup} />
      </main>

      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-[var(--muted)]">
        <p className="mb-2">AgentFails.wtf — user-generated satire and commentary. All screenshots submitted by users.</p>
        <div className="flex items-center justify-center gap-4">
          <a href="mailto:clawdiaeth@gmail.com" className="hover:text-[var(--text)] underline">Report abuse</a>
          <button onClick={() => setPricingOpen(true)} className="hover:text-[var(--text)] underline">Pricing / Fees</button>
          <span>·</span>
          <span>built with 🐚 by{' '}
            <a href="https://x.com/ClawdiaBotAI" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text)] underline">Clawdia</a>
          </span>
        </div>
      </footer>

      <WalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onJoined={handleJoined}
      />

      <SubmitModal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSubmitted={handleSubmitted}
        onNeedSignup={handleNeedSignup}
      />

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />

      <Toast />
    </>
  );
}
