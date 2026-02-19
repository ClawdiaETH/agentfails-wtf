import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Member } from '@/types';

/**
 * useMember — React Query wrapper so all instances react to
 * queryClient.invalidateQueries({ queryKey: ['member'] }) after signup.
 *
 * Previously used plain useState/useEffect which never refetched
 * after the initial load, causing vote/submit to fail until page refresh.
 */
export function useMember(walletAddress: string | undefined) {
  const { data: member = null, isLoading: loading } = useQuery<Member | null>({
    queryKey:  ['member', walletAddress?.toLowerCase() ?? ''],
    queryFn:   async () => {
      if (!walletAddress) return null;
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return (data as Member) ?? null;
    },
    enabled:   !!walletAddress,
    staleTime: 30_000,   // treat as fresh for 30s
    retry:     1,
  });

  return { member, loading };
}
