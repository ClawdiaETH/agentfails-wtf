import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface VoteArgs {
  postId: string;
  voterWallet: string;
}

export function useVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, voterWallet }: VoteArgs) => {
      // Insert vote record (unique constraint prevents duplicates)
      const { error: voteErr } = await supabase
        .from('votes')
        .insert({ post_id: postId, voter_wallet: voterWallet });
      if (voteErr) throw voteErr;

      // Increment upvote count
      const { data: post, error: fetchErr } = await supabase
        .from('posts')
        .select('upvote_count')
        .eq('id', postId)
        .single();
      if (fetchErr) throw fetchErr;

      const { error: updateErr } = await supabase
        .from('posts')
        .update({ upvote_count: ((post as any)?.upvote_count ?? 0) + 1 })
        .eq('id', postId);
      if (updateErr) throw updateErr;
    },

    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previous = queryClient.getQueryData(['posts']);
      // Optimistic update
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((pg: any) => ({
            ...pg,
            posts: pg.posts.map((p: any) =>
              p.id === postId ? { ...p, upvote_count: (p.upvote_count ?? 0) + 1 } : p
            ),
          })),
        };
      });
      return { previous };
    },

    onError: (_err, _vars, context: any) => {
      if (context?.previous) queryClient.setQueryData(['posts'], context.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
