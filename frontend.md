# Frontend Specification

## Repo Structure
- `@constants/theme.ts` — colors, fonts, `calcMultiplier()`, `getMilestone()`, `DEBUG_OUTLINES`
- `@components` — atomic UI: `CompoundingGraph`, `HabitCard`
- `@screens` — screen layouts: `IntroScreen`, `HabitDetailScreen`, `AddHabitScreen`
- `api/generateHabitGoal.ts` — `generateHabitGoal(name, why)` → Groq llama-3.1-8b-instant; returns "I will [habit] every day to become [who they become]"
- `app/(tabs)/index.tsx` — Home Screen
- `app/habit/[id].tsx` — mounts `HabitDetailScreen`; `id` is a real UUID from Supabase; params (name, why, aiGoal) passed from HabitGoalSelectScreen
- `app/habit/add.tsx` — mounts `AddHabitScreen`

## Design System
- Use colors and fonts from @constants/theme.ts. NO EXCEPTION
- `DEBUG_OUTLINES` toggle in `constants/theme.ts`

## Path Aliases
- `@components/*`, `@constants/*`, `@screens/*`

## Screens

### Intro Screen (`screens/IntroScreen.tsx`)
- Route: `app/intro.tsx` → `/intro`
- Shown once on first launch; `AsyncStorage` key `'intro_seen'` gates redirect in `_layout.tsx`
- Black background (`#000`), `SafeAreaView`, 3-segment progress bars + Skip top-right
- Horizontal `ScrollView` (pagingEnabled, scrollEnabled=false), advance via Continue button only
- **Slide 1 — "The Drop-Off"**: heading copy (BricolageGrotesque); 8 habit cards in 2 rows of 4 (each row `transform: [{ rotate: '-25deg' }]`); columns 2 & 4 raised –30px; Ionicons per card; staggered fade+translateY on mount, infinite float via `withRepeat`
- **Slide 2 — "The Why"**: Lottie runner animation (`assets/animations/runner.json`), body + bold copy
- **Slide 3 — "The Math"**: heading, dual-line SVG graph (ideal green / worst red, 0–365 days), legend, body copy
- **Slide 4 — "The 1% Better Theory"** (`screens/IntroSlide4.tsx`): heading + sub-copy explaining compounding; animated formula row (Day 0→1→2→n); 2×2 milestone card grid (1 week/month/3 months/1 year, staggered fade-in on `active`); app-context note at bottom. Last card (1 year) inverted black bg.
- "Get Started" (last slide, now slide 4) and "Skip" both call `AsyncStorage.setItem('intro_seen', '1')` → `router.replace('/(tabs)')`
- Deps: `lottie-react-native`, `@react-native-async-storage/async-storage`

### Home Screen (`app/(tabs)/index.tsx`)
- Unified compounding graph (average momentum across all habits)
- Vertical list of `HabitCard` (name, multiplier, 7-day sparkline)
- **Edit mode**: pencil icon (`Feather edit-2`) next to "Habits" heading; toggles `isEditMode`; shows "Done" text when active
  - Cards wiggle (rotation oscillation via `withRepeat/withSequence`) with staggered delay per index
  - Red ✕ badge overlaid on top-right of each card; tap shows delete confirmation bottom-sheet modal
  - Modal copy: warns about permanent deletion of habit and compounding progress; "Delete habit" (red) / "Keep it" (bordered) buttons
  - Add Habit button hidden while in edit mode

### Add Habit Screen (`screens/AddHabitScreen.tsx`)
- Route: `app/habit/add.tsx` → `/habit/add`
- Black header (no title) with white back arrow
- Scrollable layout (`ScrollView`)
- **Motivation card** (`#111` bg): "Know your why." heading + prose explaining why surface-level reasons fail; prompts deep self-questioning
- Fields:
  1. Habit name (text input, auto-focused, Return → focus Why field)
  2. Why do you need this? (multiline, blurOnSubmit → handleSave)
- "Add Habit" button disabled until both fields are non-empty; shows "Adding…" while Groq call is in-flight
- On save: calls `generateHabitGoal(name, why)` → pushes to `/habit/select` with `{ name, why, options }` params

### Habit Detail Screen (`screens/HabitDetailScreen.tsx`)
- Scrollable layout (`ScrollView`)
- **Intro** — prose summary: habit name, goal, growth %, wins/total days
- **Graph** — `CompoundingGraph`, height adaptive via `getMilestone(total) * screenH`; expands downward when data dips below baseline
- **Calendar** — `react-native-calendars` period-marking; tap to toggle done/missed; persisted to Supabase `habit_entries` via `upsertEntry`/`deleteEntry`
- Params: reads `id` (UUID), `name`, `aiGoal` from `useLocalSearchParams`; loads entries from Supabase `fetchEntries(id)` on mount
- Intro tappable underlines: tapping habit name or goal opens an inline `TextInput` below the paragraph (same section); blur/Done commits the edit; active field dims to `textMuted`

## CompoundingGraph (`components/CompoundingGraph.tsx`)
- SVG, pinch-to-zoom (`visibleDays` 30d–milestone.maxDays), scrub cursor via PanResponder
- Y scale: `[minVal, maxVal]` — baseline floats up when user dips below 1.0
- Ideal reference line (green), gradient fill, 3-ring endpoint beacon
- Milestone system: ≤30d / ≤90d / ≤365d / 730d → different maxVal + heightRatio
- `StatsOverlay` sub-component: total growth + daily delta; ⓘ button toggles inline info panel explaining the compound formula

## Analytics
- Formula: `V = 1.01^wins × 0.99^losses`
- Aggregated home view: `Σ multipliers / n`

## Phase Status
- [x] Phase 1: Scaffold (Expo, navigation, theme)
- [x] Phase 2: Graph & Calendar UI
- [x] Phase 3: Backend (Supabase schema, guest auth, CRUD wired)
- [ ] Phase 4: Home screen aggregated graph
