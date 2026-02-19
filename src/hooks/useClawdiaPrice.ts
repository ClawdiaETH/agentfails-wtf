import { useQuery } from '@tanstack/react-query';
import { CLAWDIA_ADDRESS } from '@/lib/constants';

const COINGECKO_URL = `https://api.coingecko.com/api/v3/simple/token_price/base?contract_addresses=${CLAWDIA_ADDRESS}&vs_currencies=usd`;

export function useClawdiaPrice() {
  return useQuery({
    queryKey: ['clawdiaPrice'],
    queryFn: async () => {
      const res = await fetch(COINGECKO_URL);
      if (!res.ok) throw new Error('Price fetch failed');
      const data = await res.json();
      const price = data[CLAWDIA_ADDRESS.toLowerCase()]?.usd ?? data[CLAWDIA_ADDRESS]?.usd;
      return price ? Number(price) : null;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
    retry: 2,
  });
}
