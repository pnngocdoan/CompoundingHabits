# Backend Specification

## Status
- [x] Phase 3: Supabase schema implemented, guest auth wired, CRUD functions live

## Data Schema (Supabase/Postgres)
- Table: `habits` (id uuid PK, user_id uuid, name text, why text, ai_goal text, created_at timestamptz)
- Table: `habit_entries` (habit_id uuid FK → habits.id cascade, date date, completed boolean, PRIMARY KEY (habit_id, date))
- Row Level Security: users own only their rows via `auth.uid() = user_id`

## Auth
- Anonymous (guest) sign-in via `supabase.auth.signInAnonymously()` — called once on app init in `_layout.tsx`
- Session persisted in AsyncStorage; auto-refreshed
- `user_id` scopes all data per device/user

## Compounding Logic
- Calculated **client-side** in `buildGraphData()` (`screens/HabitDetailScreen.tsx`) and `computeHabitStats()` (`screens/HomeScreen.tsx`)
- Formula: `V = Π(1.01 if done, 0.99 if missed)` — same as Edge Function spec but runs on device
- No Supabase Edge Function needed for Phase 3

## API Layer (`api/`)
- `api/supabase.ts` — Supabase client singleton (AsyncStorage session)
- `api/habits.ts` — CRUD: `ensureGuestSession`, `createHabit`, `fetchHabits`, `deleteHabit`, `upsertEntry`, `deleteEntry`, `fetchEntries`

## Guidelines
- Timezone Safety: Store dates as YYYY-MM-DD (Date type)
- Accuracy: Maintain 4 decimal places for multipliers
