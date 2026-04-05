# Project: Habit Compounding Tracker

## Mission & Context
Build a mobile-first habit tracker that treats daily actions like compound interest. This app visualizes the "Slight Edge" philosophy: doing a habit makes you 1% better (1.01 multiplier), skipping it makes you 1% worse (0.99 multiplier). 

The goal is to show the massive gap over a year:
- Ideal Path: 1.01^365 = 37.7
- Worst Path: 0.99^365 = 0.03

## Tech Stack
- Framework: React Native + Expo (iOS/Android/iPad/Watch ready)
- Backend: Supabase (Postgres + Edge Functions)
- Design: Minimalist Black & White (Tailwind/NativeWind)

---

## Status Tracker
- [x] Phase 1: Frontend Scaffold (Expo, Navigation, Theme)
- [x] Phase 2: Graph & Calendar UI (SVG Series, Heatmap logic)
- [ ] Phase 3: Backend & Math (Supabase Schema, Edge Function Math)
- [ ] Phase 4: Aggregation (Home screen Total Life Momentum graph)

## Project Navigation
- Frontend Specs: [frontend.md](./frontend.md)
- Backend Specs: [backend.md](./backend.md)

## ⚡ Efficiency Protocols (STRICT)
- **Spec First:** Read only the relevant section of `frontend.md`/`backend.md` (use line range), not the full file.
- **Active Updates:** **CRITICAL:** Update `frontend.md` and `backend.md` specs immediately following any development changes to prevent drift.
- **Planning:** Always use `/plan` before complex brainstorming or generation.
- **Permission:** Ask before reading >3 files in one turn.
- **Selective Reading:** Use `read <file>:<line-range>` for specific tasks. Use `Grep` to check for a value in a file — never read the whole file just to confirm one thing.
- **Edit over Write:** Always use `Edit` for changes to existing files. Never use `Write` to rewrite a file unless it is a new file or a complete structural overhaul explicitly requested.
- **Anti-Vagueness:** Prompt <10 words = Ask 3 clarifying questions.
- **No Speculative Scans:** Only act on provided `@` or file paths.
- **Compact:** Suggest `/compact` every 10 messages or 60% context.
- **Output:** Code changes + 1-sentence explanation only.
