import { supabase } from './supabase';

export async function ensureGuestSession(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user.id;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) throw new Error(error?.message ?? 'Anonymous sign-in failed');
  return data.user.id;
}

export interface HabitRow {
  id: string;
  name: string;
  why: string;
  ai_goal: string;
  created_at: string;
}

export async function createHabit(name: string, why: string, aiGoal: string): Promise<HabitRow> {
  const userId = await ensureGuestSession();
  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: userId, name, why, ai_goal: aiGoal })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create habit');
  return data as HabitRow;
}

export async function fetchHabits(): Promise<HabitRow[]> {
  await ensureGuestSession();
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as HabitRow[];
}

export async function deleteHabit(habitId: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', habitId);
  if (error) throw new Error(error.message);
}

export async function upsertEntry(habitId: string, date: string, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from('habit_entries')
    .upsert({ habit_id: habitId, date, completed }, { onConflict: 'habit_id,date' });
  if (error) throw new Error(error.message);
}

export async function deleteEntry(habitId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('habit_entries')
    .delete()
    .eq('habit_id', habitId)
    .eq('date', date);
  if (error) throw new Error(error.message);
}

export async function fetchEntries(habitId: string): Promise<Record<string, 'done' | 'missed'>> {
  const { data, error } = await supabase
    .from('habit_entries')
    .select('date, completed')
    .eq('habit_id', habitId)
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);
  const map: Record<string, 'done' | 'missed'> = {};
  for (const row of data ?? []) {
    map[row.date] = row.completed ? 'done' : 'missed';
  }
  return map;
}
