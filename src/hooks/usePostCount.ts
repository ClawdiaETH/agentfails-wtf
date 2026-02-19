import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Returns the total published post count.
 * Used to determine phase (< 100 = phase 1 free posting; ≥ 100 = $0.10/post).
 */
export function usePostCount() {
  return useQuery({
    queryKey: ['postCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 1000 * 60, // 1 min — fresh enough for phase gating
  });
}
