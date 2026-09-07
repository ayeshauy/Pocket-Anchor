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

## Implemented (Jun 2026, iter 3)
- **Resend managed email** (`/app/backend/emailer.py`, G1-G5 guardrail gate on every send): guardian invite email with accept + circle links, weekly soft summary digest
- **Guardian accept flow**: `accept_token` on invites; `GET /api/guardians/accept/{token}` flips invited→active; public supporter portal `/circle/{token}` (silent mood weather, weekly counters, Thinking-of-You pulse back, Willow Grove day prompt)
- **Weekly soft summary cron**: `.emergent/crons.yml` Sundays 9am UTC → `POST /api/cron/weekly-summary` (Bearer WEBHOOK_CRON_SECRET, constant-time compare, run_id idempotency, asyncio background handoff)
- **OG link previews**: `GET /api/og/{slug}` serves OG/Twitter meta + redirect to SPA; `GET /api/og/{slug}.png` generates branded 1200x630 card via PIL (Liberation Serif). Dashboard copy-link now copies the OG URL
- Verified: invite email 202 Accepted via managed proxy, accept flips status→active, circle view + pulse back work, cron auth 401/200 + run_id idempotency confirmed, weekly summary emails sent to active guardians

## Implemented (Jun 2026, iter 4) — Pricing & Stripe
- **Stripe claimable sandbox** (Flow A) provisioned; catalog via `setup_stripe.py` (idempotent): Nomad Pass $12/mo + $99/yr, Enterprise Duty-of-Care $6/seat/mo; SaaS tax code; Stripe fully manages tax & compliance (SMP, CA account)
- **Checkout**: `GET /api/stripe/checkout?plan=nomad-pass|nomad-pass-yearly|enterprise&seats=N` → 303 to Stripe hosted checkout; `payment_transactions` recorded before redirect; success → `/dashboard?session_id=`, auto-links subscription to the user (`POST /api/stripe/link`)
- **Status/polling**: `GET /api/payments/status/{session_id}` (unauth, Stripe-verify fallback), `GET /api/stripe/status` (auth, subscription state), webhook `/api/stripe/webhook` (signature-verified, idempotent)
- **Pricing page** `/pricing`: three tiers — Safety $0 free forever (never paywalled, links straight to tools), Nomad Pass with monthly/yearly toggle, Enterprise with seat slider; zero-knowledge messaging; crisis-first footer
- **Health gating**: Nomadic Health pillar shows a gentle "The road needs a pass" upgrade card without an active subscription; Safety layer untouched (always free)
- **Pulse emails**: owner→guardian pulses email the guardian (with circle link); guardian→owner pulses email the owner — via managed Resend templates
- **OG mood variants**: `/api/og/:slug.png` orb now reflects latest mood state (willow/mimosa/azul)
- **Circle page**: added owner's Anchor Link card so guardians can leave a reason directly

## Implemented (Jun 2026, iter 5) — Landing architecture rebuild
- Full landing restructure per spec: header nav (Platform | About | How It Works | Best Fit | Plans | FAQ anchor links), "Launch Sanctuary" CTA, "Quick Exit (ESC)" header control wired via `anchor:quick-exit` custom event to the site-wide decoy
- Hero: AI-Native/Zero-Knowledge/Privacy-First badge, "Your Private Digital Health & Safety Sanctuary" headline, dual CTAs (Nomad Pass checkout + free crisis tools)
- Six sections: Platform (3 pillar cards), About (Privacy as a Fundamental Human Right), How It Works (3 steps), Best Fit (3 audiences), Plans (3 tier cards → Stripe checkout), FAQ (10-question shadcn accordion)
- Smooth scroll + scroll-padding for anchored sections; landing nav also renders on /pricing and /safety
- Verified: all nav testids present, FAQ #3 opens, plan buttons 303 to Stripe, Quick Exit decoy fires from nav button

## Implemented (Jun 2026, iter 6) — Live Sandbox + new logo
- **Live Sandbox** on landing (`LiveSandbox.jsx`, between Platform and About): three no-account demos — in-browser voice recorder (MediaRecorder, local playback, zero upload), pharmacy stock inspector (`GET /api/demo/pharmacy?med=` — public, deterministic demo data, local brand names across 6 countries), and a live Survivor Navigator chat streaming from `/api/ai/chat` with suggestion chips
- **New official logo** (dark willow rounded square, white anchor) replaced everywhere: nav, auth modal, favicon, OG card asset (`/app/backend/assets/logo.png`)
- Verified: pharmacy table renders with stock/price/Rx, navigator streams a real Claude response, voice tab recorder UI present, logo in nav
- **Platform section rebuilt** (iter 6b): new header "Every feature belongs to one of three" + deliberate-split subtitle; each pillar card now carries italic tagline, 5-item "What it includes" checklist with notes, and interactive module chips (♡ Anchor / ◉ Health Guide / ⚑ Resources sets)
- **How It Works rebuilt** (iter 6c): embedded 2-min product demo video (`/demo.mp4`, served from public) in a framed player with caption, plus 3 quick-reference chapter summaries (Zero-Knowledge Sanctuary Setup / Cross-Border Nomadic Healthcare / Zero-Auth Survivor & IPV Safety). Source MP4 was an unsupported codec for browsers — transcoded to H.264/AAC + faststart (13.4MB → 3.5MB) via imageio-ffmpeg; also added full-length VP8/Vorbis WebM source (11.3MB) for codec-less Chromium; `<video>` uses dual `<source>` tags (webm first, mp4 fallback)

## Implemented (Jun 2026, iter 7) — Mobile navigation fix
- Bug: logged-in mobile users saw only "Sanctuary" — Health/Safety hidden (desktop nav was md:flex/lg:flex with no mobile fallback)
- Fix (`TopNav.jsx`): always-visible pill bar under header on mobile dashboard (Sanctuary/Health/Safety, active pill in willow) + hamburger menu panel on all pages (dashboard links / landing anchors / Pricing / Quick Exit)
- **Verified by testing_agent (iteration_2): 30/30 nav assertions passed on 390x844 + desktop regression clean**
- Follow-up fixes from test report: dashboard mobile horizontal overflow fixed (px-4 + overflow-x-hidden + break-all on anchor URL), landing "Launch Sanctuary" CTA no longer clipped at 390px, pillar bar now persists on /safety for logged-in users, a11y attrs (aria-expanded/aria-controls/role) on hamburger + panel. Self-verified: scrollWidth 390=390 on dashboard + landing, CTA edge 371<390, safety pill active on /safety

## Implemented (Jun 2026, iter 8) — Landing-to-product alignment + pillar bar everywhere
- Mobile pillar bar now also shows on /pricing and /with/:slug for signed-in users; TopNav renders on anchor pages when the owner is logged in (supporters still see the clean, nav-free page)
- Landing copy audited against shipped product: removed/rewrote unbuilt claims (client-side AES-256, decoy password, EXIF stripping, SLM translation, USDC rails, care orchestration, proactive monitoring, granular journal sharing). FAQ Q1/Q3/Q4/Q9/Q10 now describe real features (private-by-default, Notes & Recipes decoy mode, live clinic map, zero-auth safety, guardian circles). Hero badge → "AI-Native · Privacy-First · Crisis Tools Always Free"; About + Pricing zero-knowledge claims rewritten honestly with roadmap note
- Verified: pillar bar on /with/:slug + /pricing (mobile, logged-in), anonymous anchor page stays nav-free, fixed App.js Router crash (`user` not in scope), FAQ copy contains no zero-knowledge/decoy-password claims

## Implemented (Jun 2026, iter 9) — Déjà (Core Layer)
- **Déjà feature** at /dashboard/deja (Nomad Pass gated, nav pill desktop+mobile, landing Core Layer card updated): dreams → memories → reality loop
- Record a Dream: voice (Whisper via OpenAISpeechToText → auto-transcribe) or text + optional location/country/tags; Claude extracts places/objects/people/environment/actions/emotions/colors/sounds automatically
- Original dream record: timestamped, immutable; reflections append beside (never overwrite)
- "I'm Experiencing Déjà Vu": moment description → element extraction → semantic matching over dream vault (Claude, meanings not keywords; verified: "carrying luggage through a huge terminal" ↔ "walking through an airport with my suitcase" = 92%) → user verdict (confirmed/possible/coincidence) — user always decides
- Dream Vault: chronological, searchable, match-status badges, delete per dream
- Déjà Map: private country-level grouping (dreams/moments/confirmed counts)
- Profile: counts + recurring themes (descriptive only, no diagnostic language) + privacy panel (export JSON, delete all with confirm, clear AI explanation)
- Shareable cards: canvas-rendered night-gradient PNG with dream/reality/similarity, location toggle, download
- Backend: /api/deja/{dreams, moments, moments/:id/verdict, dreams/:id/reflection, profile, map, export, all, transcribe} — all auth-scoped per user
- **testing_agent iteration_3: 18/18 backend pytest + 100% frontend** — extraction JSON keys, reflection immutability, 92% semantic match, verdict propagation, gating UI, privacy panel all verified
- Follow-up fixes: server-side Nomad Pass enforcement (`require_subscribed_user`) on all /api/deja/* (12 handlers) + /api/medical/* (3 handlers); DialogDescription a11y fix on reflection dialog. Verified: subscribed 200, unsubscribed 402 on gated endpoints, free surfaces (journal/evidence/rebuilding/clinics) remain open
- Language guardrails enforced: "possible match", "similarity, not proof", "you decide what it means"; no prediction claims anywhere

## Implemented (Jun 2026, iter 10) — Core Layer expansion (incremental, no redesign)
- Landing: "One app. Six moments." section (six compact rows + understated closing line) inserted between Platform and Live Sandbox — hero/brand/sections untouched
- Core Layer hub (`CoreTools.jsx` on Health page, grouped Essential / Preparedness / Explore):
  - **SOS** — 911/112/988 direct-call grid + Quick Exit (reuses existing `anchor:quick-exit` event; no duplication)
  - **Nearby Help** — 8 tap categories (hospital/clinic/pharmacy/police/mental-health/LGBTQ+/embassy/accessible) via `GET /api/nearby?category=` reusing clinic + resource data
  - **Translate** — Claude health/safety translation into 10 languages + "SHOW THIS TO SOMEONE" high-contrast full card (`POST /api/translate`)
  - **Health Card** — optional fields (name/blood type/allergies/meds/conditions/emergency contact/insurance), `PUT/GET /api/health-card`, read-only SHOW view
  - **Trusted Contact** — CRUD + one-tap "I'm safe"/"I need help" pings that email contacts via Resend (`contact_ping_html` template, G4-gated)
  - **Check-In** — destination + due time; expired → "Are you okay?" with I'm safe / Alert my contact (emails trusted contacts)
  - **Private Vault** — labeled notes/documents/contacts/insurance/health items (`/api/vault`)
  - **Trip Pack** — country + days remaining → shows local emergency number, embassy, trusted contacts, health card summary (`/api/trip-pack`, country info table)
  - **Explore → Déjà** module card linking to existing Déjà feature
- All new endpoints gated server-side with `require_subscribed_user` (Nomad Pass)

## Implemented (Jun 2026, iter 11) — Optimization & SEO polish (no redesign)
- **P1 Technical SEO**: title → "Private Travel Health & Safety Platform | Pocket Anchor" (55 chars); canonical https://pocketanchor.tech/; full OG + Twitter card meta; JSON-LD graph (Organization + WebSite + SoftwareApplication w/ real $12 offer, no fake ratings); robots.txt (disallows /dashboard, /onboarding, /circle, /guardian, /api) + sitemap.xml (/, /pricing, /safety)
- **P0 Performance**: logo downscaled 1596px→256px (16KB served, original kept as logo-full.png); branded og-cover.png (1200×630, 57KB) generated in-site identity; video already preload=metadata + dual codec
- **P2 Accessibility/semantics**: <main id="main-content"> wrapper + skip-to-content link; prefers-reduced-motion disables orb/breath/firefly animations; reduced transition durations
- **QA verified**: zero horizontal overflow at 390/768/1920; title/canonical/OG/twitter/JSON-LD/robots/sitemap all served correctly

## Implemented (Jun 2026, iter 12) — Mobile audit & fix
- Full 390px audit of landing (all sections), pricing, safety (+navigator), dashboard (all 5 tabs), health (+nearby open), déjà (all 5 tabs), anchor public: all PASS except logged-in /with/:slug header overflow (439px — hamburger + Launch Sanctuary + logout cluster)
- Fix: Launch Sanctuary button hidden below sm for signed-in non-dashboard pages; added "Launch Sanctuary" as first item in the mobile menu panel; verified no offenders remain, dashboard regression clean

## Implemented (Jun 2026, iter 13) — Google Auth confirmation & cleanup
- Emergent-managed Google sign-in confirmed fully wired and verified: Continue with Google → auth.emergentagent.com redirect → /api/auth/session exchange → 7-day httpOnly cookie; /me 401 without auth / 200 with session; logout clears session
- Removed the placeholder "email magic link" section from AuthModal (was never wired, just rerouted to Google) — modal is now clean single-option Google sign-in

## Deployment readiness (Jun 2026)
- deployment_agent health check: **PASS**, zero findings
- **Deploy queued** (job 2b0cac57-38a9-4233-9ffa-315f10369cb7) — awaiting live URL
- Stripe sandbox status: **claimed**; live keys pending Stripe KYC approval — auto-swap + auto-redeploy on `account_activated`
- **Custom domain pocketanchor.tech LIVE** (verified by user): serves app (200), API, robots, sitemap, OG routes; backend `APP_URL`/`APP_PUBLIC_URL` flipped to https://pocketanchor.tech; CORS_ORIGINS="*" already covers it; Google Auth origin-agnostic (window.location.origin) — works on both domains
- **PENDING — post-approval $0 verification**: once Stripe approves, confirm live keys landed in backend/.env (rk_live/sk_live), create a live-mode checkout session, and confirm it opens. Run without prompting.
- Official logo added: anchor icon at /app/frontend/public/logo.png (nav, auth modal, favicon, OG cards)

## Backlog
- **P0:** Email supporter link out (Resend) when a guardian is invited; shareable OG preview card for `/with/:slug`
- **P1:** Wearable ingest (Apple Health/Google Fit); guardian-accept flow (invited → active via emailed link)
- **P2:** USDC/Stripe payments, dental & STD clinic subverticals, granular journal sharing by tag

## Architecture notes
- MongoDB: users, user_sessions, mood_pulses, journal, hope_reasons, evidence, rebuilding, medical, files, ai_messages
- Object storage prefix: `pocket-anchor/{public|private}/{user_id}/{uuid}.{ext}`
- SSE headers: `X-Accel-Buffering: no` to defeat proxy buffering
- Session cookie: httpOnly, secure, samesite=none
