# Pocket Anchor - PRD

**Owner:** ayesha.pocketagency@gmail.com
**Started:** Feb 2026
**Stack:** FastAPI · MongoDB · React 19 · Emergent (Google Auth, Universal LLM, Object Storage)

## Problem statement (verbatim)
Pocket Anchor is a warm, non-clinical digital sanctuary structured into three pillars — Sanctuary & Silent Support, Nomadic Health & Medical Infrastructure, and Survivor & IPV Support Services — for travelers and individuals in crisis. Color palette: Cloud, Azul, Mimosa, Orange, Aperol, Willow Grove. Typography: Cormorant Garamond + DM Sans.

## User choices (locked)
- All three pillars at MVP fidelity
- Emergent-managed Google Auth (no passwords)
- Emergent Universal LLM key with **Claude Sonnet 4.6** (streaming SSE)
- Emergent Object Storage for uploads
- Deferred: USDC payments (Financial Anchor), wearables, STD/dental booking

## Personas
- **The Anchor holder** — user in silent struggle; wants passive support, no metrics.
- **The Supporter** — friend/family who lands on `/with/:slug`; leaves a reason to stay.
- **The Traveler** — needs vetted clinics, medical vault, language-aware triage.
- **The Survivor** — needs discreet resources, evidence vault, quick-exit safety.

## Implemented (Feb 2026, iter 1)
- Auth: Emergent Google OAuth, /api/auth/session + /me + /logout, session cookie 7d
- Onboarding: sanctuary name + auto slug + Anchor Link generation
- Sanctuary: Mood Pulse orb (3 states), 14-day chart, Wall of Hope (Felt/Fav), Break Glass Archive, Private Journal (mood + tags), Breathing Player (4-7-8, Box, Wave), Comfort AI (Claude Sonnet 4.6 SSE), 988 SOS
- Anchor public `/with/:slug`: text/photo/voice/song, kindness counter, no login, no receipts
- Nomadic Health: Spatial Health Guide (6 seeded clinics), Medical Vault CRUD, Global Doctor Network cards
- Safety: Public Resource Directory (US/UK/AU/IN/FR), Survivor Navigator AI (Claude Sonnet 4.6), Evidence Vault with decoy mode ("Notes & Recipes"), Rebuilding Tracker (4 tracks)
- Quick Exit: floating button + Esc×2 decoy weather screen (site-wide)
- Object storage: public + private uploads, blob download with auth

## Implemented (Jun 2026, iter 2)
- **Voice Recording**: in-browser MediaRecorder voice notes on the Anchor public page (`VoiceRecorder.jsx`), uploaded as `audio/webm` via `/api/upload/public/:slug`
- **Real Clinic Map**: Leaflet + OpenStreetMap tiles (`ClinicMap.jsx`) replacing the gradient stub; pins color-coded by 24/7 availability
- **Guardian Invites + Thinking-of-You Pulse**: `POST/GET/DELETE /api/guardians`, `POST /api/guardians/:id/pulse`, `GET /api/guardians/feed`; `GuardianPanel.jsx` dashboard tab with invite form + supporter notification feed
- **Memory Vault**: `POST/GET/DELETE /api/memory`; `MemoryVault.jsx` dashboard tab — photo/voice/video/letter kinds with media upload, person attribution

## Backlog
- **P0:** Email supporter link out (Resend) when a guardian is invited; shareable OG preview card for `/with/:slug`
- **P1:** Wearable ingest (Apple Health/Google Fit); guardian-accept flow (invited → active via emailed link)
- **P2:** USDC/Stripe payments, dental & STD clinic subverticals, granular journal sharing by tag

## Architecture notes
- MongoDB: users, user_sessions, mood_pulses, journal, hope_reasons, evidence, rebuilding, medical, files, ai_messages
- Object storage prefix: `pocket-anchor/{public|private}/{user_id}/{uuid}.{ext}`
- SSE headers: `X-Accel-Buffering: no` to defeat proxy buffering
- Session cookie: httpOnly, secure, samesite=none
