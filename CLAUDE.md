# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
```

No test or lint scripts are configured.

## Architecture

**VELIOR** is a luxury watch marketplace built with Next.js 16 App Router + Supabase.

### Data Flow

- **Server Components** query Supabase directly via `lib/supabase/server.ts` (cookie-based session)
- **Client Components** use the browser client from `lib/supabase/client.ts`
- **Mutations** go through Server Actions in `lib/actions.ts` — all business logic lives here (auth, listings, messages, favorites, subscriptions)
- `revalidatePath()` is used after mutations to refresh cached data

### Key Architectural Decisions

- **No client-side state management library** — Supabase is the source of truth; React `useState` handles transient UI state only
- **Row-Level Security (RLS)** enforces data access at the database level — the app relies on this, not application-layer guards
- **Subscription tiers** (`free`/`pro`/`elite`) gate listing count, favorites, and contact limits — see `TIER_CONFIG` in `lib/types/index.ts`; limits are enforced in `lib/actions.ts`

### Auth

Supabase Auth with email/password and magic links. OAuth handled via `/app/auth/callback/`. Sessions stored in HTTP-only cookies via `@supabase/ssr`.

### Storage

Watch listing images are uploaded to a public Supabase Storage bucket (`listing-images`). Image arrays are stored directly on the `listings` table.

### Design System

Brutalist luxury aesthetic: zero border radius, **Cormorant Garamond** (serif) + **Space Grotesk** (sans-serif). Components use shadcn/ui (base-nova style) with Tailwind CSS v4. Path alias `@/*` maps to the project root.

### Database Schema (Supabase)

- `profiles` — extends `auth.users`; includes `subscription_tier`, `verified`
- `listings` — watch listings with `images` array, `status` (active/sold/draft), `seller_id` FK
- `messages` — buyer↔seller inquiries; `listing_id` + `sender_id` + `recipient_id`
- Triggers auto-create a profile on signup and update `listings.updated_at`
- Schema source: `supabase/schema.sql`

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_SITE_URL
```
