import { createClient } from '@supabase/supabase-js';

interface ScoreRow {
  name: string;
  score: number;
}

type SupabaseClient = ReturnType<typeof createClient>;

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      return null;
    }
    client = createClient(url, key);
  }
  return client;
}

export async function submitScore(name: string, score: number): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;

  const { data: existing } = await supabase
    .from('leaderboard')
    .select('score')
    .eq('name', name)
    .maybeSingle<ScoreRow>();

  if (existing !== null && existing.score >= score) return;

  await supabase
    .from('leaderboard')
    .upsert({ name, score }, { onConflict: 'name' });
}

export async function getTopScores(limit = 20): Promise<ScoreRow[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('leaderboard')
    .select('name, score')
    .order('score', { ascending: false })
    .limit(limit)
    .returns<ScoreRow[]>();

  return data ?? [];
}
