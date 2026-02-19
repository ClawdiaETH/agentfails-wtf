import { base } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'cdad684f1a4430468db1ed76b58c59bb';

export const wagmiConfig = getDefaultConfig({
  appName: 'AgentFails.wtf',
  projectId,
  chains: [base],
  ssr: true,
});
