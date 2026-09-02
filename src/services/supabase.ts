import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fnnllbocbzyuvlxijumf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1_Ilw2vg292ueEpttgY5tQ_wXPJDJr1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ================= SUPABASE AUTH HELPERS =================

export async function supabaseSignUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) throw error;
  return data;
}

export async function supabaseSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function supabaseSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function supabaseGetUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

// ================= SUPABASE DATA HELPERS =================

export async function fetchHeroesFromSupabase() {
  const { data, error } = await supabase
    .from('heroes')
    .select('*');

  if (error) {
    console.warn('[Supabase] Could not fetch heroes from Supabase, using local fallback:', error.message);
    return null;
  }
  return data;
}

export async function fetchLeaderboardFromSupabase() {
  const { data, error } = await supabase
    .from('leaderboards')
    .select('*, users(username, avatar, trophies, rank_tier)')
    .order('global_rank', { ascending: true })
    .limit(10);

  if (error) {
    console.warn('[Supabase] Could not fetch leaderboard from Supabase, using local fallback:', error.message);
    return null;
  }
  return data;
}

export async function recordMatchToSupabase(matchData: {
  game_mode: string;
  winning_team: 'blue' | 'red';
  duration_seconds: number;
  blue_crystals: number;
  red_crystals: number;
}) {
  const { data, error } = await supabase
    .from('matches')
    .insert([
      {
        id: 'm_' + Date.now(),
        game_mode: matchData.game_mode,
        winning_team: matchData.winning_team,
        duration_seconds: matchData.duration_seconds,
        blue_crystals: matchData.blue_crystals,
        red_crystals: matchData.red_crystals,
      },
    ])
    .select();

  if (error) {
    console.warn('[Supabase] Match record skipped (tables may be pending):', error.message);
    return null;
  }
  return data;
}
