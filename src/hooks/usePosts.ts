import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';

export type Tab = 'hot' | 'new' | 'hof' | 'openclaw' | 'other';

const PAGE_SIZE = 10;

async function fetchPosts({ pageParam, activeTab }: { pageParam: number; activeTab: Tab }) {
  let query = supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

  switch (activeTab) {
    case 'hot':
      query = query.order('upvote_count', { ascending: false });
      break;
    case 'new':
      query = query.order('created_at', { ascending: false });
      break;
    case 'hof':
      query = query.order('upvote_count', { ascending: false });
      break;
    case 'openclaw':
      query = query.eq('agent', 'openclaw').order('upvote_count', { ascending: false });
      break;
    case 'other':
      query = query.neq('agent', 'openclaw').order('upvote_count', { ascending: false });
      break;
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return {
    posts: (data ?? []) as Post[],
    nextPage: pageParam + 1,
    total: count ?? 0,
  };
}

export function usePosts(activeTab: Tab) {
  const result = useInfiniteQuery({
    queryKey: ['posts', activeTab],
    queryFn: ({ pageParam }) => fetchPosts({ pageParam: pageParam as number, activeTab }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.posts.length === PAGE_SIZE ? last.nextPage : undefined,
    staleTime: 1000 * 30,
  });

  const posts = result.data?.pages.flatMap(p => p.posts) ?? [];
  const total = result.data?.pages[0]?.total ?? 0;

  return { ...result, posts, total };
}
