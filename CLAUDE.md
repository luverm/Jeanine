# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Jeanine** is a booking and lead platform for a Dutch self-employed hairstylist
and bridal stylist. There is **one admin** (Jeanine herself) and two kinds of
customer:

- **Regular customers** book appointments themselves online (cut, colour, blow-dry).
- **Bridal customers** do not book directly — they submit a contact form so Jeanine
  can qualify the lead and plan a consult.

The UI, routes, and much of the domain vocabulary are in **Dutch** (`boeken`,
`leads`, `instellingen`, `facturen`, `agenda`). Keep new user-facing copy and
route segments Dutch to stay consistent.

## Commands

Package manager is **pnpm**. Node 20+.

| Command | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server (http://localhost:3000) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint (`eslint-config-next`) |
| `pnpm typecheck` | `tsc --noEmit` — strict mode |
| `pnpm test` | Run the Vitest suite once |
| `pnpm test:watch` | Vitest in watch mode |

Run a single test file: `pnpm test tests/availability.test.ts`
Run tests matching a name: `pnpm exec vitest run -t "computeAvailableSlots"`

CI (`.github/workflows/ci.yml`) runs `typecheck`, `lint`, `test`, `build` on every
PR — all four must pass.

### Local database (Supabase)

Requires Docker + the Supabase CLI.

```bash
supabase start          # boots Postgres, Auth, Studio; prints local keys
supabase db reset       # DESTRUCTIVE: replays migrations/*.sql then seed.sql
supabase migration new <name>   # create a new numbered migration file
```

Copy the keys printed by `supabase start` into `.env.local` (see
`.env.local.example`). `scripts/seed.mjs` is an alternative seeder that inserts
the same data via the REST API (idempotent, used against remote projects).

## Tech stack

Next.js 16 (App Router, React 19, Server Components + Server Actions) ·
TypeScript strict · Supabase (Postgres, Auth, Storage) · Tailwind CSS v4 +
shadcn/ui · react-hook-form + zod v4 · date-fns + date-fns-tz · nodemailer
(SMTP) · pdf-lib (invoices) · @dnd-kit (leads kanban) · deployed on Vercel.

Import alias: `@/*` → `src/*`.

## Architecture

### Request layering — never skip a layer

```
React component  →  src/actions/*  (Server Actions, "use server")
                 →  src/lib/db/*   (typed Supabase queries)
                 →  Supabase
```

- **No business logic or direct DB access in components.** Mutations go through a
  Server Action; reads go through `src/lib/db/*`.
- Server Actions export **one named function per action** (no default export) and
  return discriminated-union result types (e.g. `{ ok: true } | { ok: false; code }`).
- Server-only modules start with `import "server-only"`.

### Route groups

- `src/app/(public)/` — landing, `diensten`, `portfolio`, `boeken` (booking flow),
  `bruid/contact` (bridal lead form), plus token-protected customer self-service
  pages `afspraak/[id]` (cancel/reschedule own booking) and `review/[id]`.
- `src/app/(admin)/` — `dashboard`, `boekingen`, `leads`, `klanten`, `agenda`,
  `facturen`, `berichten` (chat inbox), `instellingen/*`. Login lives at
  `/login` and first-run setup at `/login/setup`.
- `src/app/api/` — `ics` (token-protected iCal feed), `invoices/[id]/pdf`,
  `cron/reminders`, `webhooks/resend`, plus admin/debug helpers.

### Auth and the critical security invariant

- Admin auth is **email + password** via Supabase Auth. `signInWithPassword` and
  `setupAdmin` (first-run bootstrap that creates the admin user) live in
  `src/actions/auth.ts`. `src/lib/auth/staff-bootstrap.ts` self-heals the link
  between `auth.users` and the `staff` row.
- **`src/proxy.ts`** is the route guard. (Next.js 16 renamed `middleware.ts` →
  `proxy.ts` — there is no `middleware.ts`.) It only protects **page** routes
  under `/dashboard`, `/boekingen`, `/leads`, `/klanten`, `/instellingen`.
- **Server Actions are public POST endpoints — `proxy.ts` does NOT protect them.**
  Every privileged action must call `requireAdmin()` from
  `src/lib/auth/require-admin.ts` itself. This is the single most important rule:
  any new admin action without `requireAdmin()` is a security hole.

### Supabase clients (`src/lib/supabase/`)

- `browser.ts` — client components, anon key.
- `server.ts` — cookie-bound server client, anon key, **respects RLS**. Use for
  reads as the authenticated admin.
- `service.ts` — service-role key, **bypasses RLS**, `server-only`. Used for
  anonymous public writes (bookings, leads) and admin mutations.

RLS is enabled on every table: writes are limited to `service_role` or an active
staff member; public reads are granted only where needed (active services,
opening hours, etc.).

### Time zones — always go through `src/lib/time.ts`

All timestamps are stored UTC (`timestamptz`) and displayed in `Europe/Amsterdam`.
**Never call `new Date()` on a raw DB value in a component.** Every conversion
uses helpers in `src/lib/time.ts` (`zonedDateTimeToUtc`, `formatInTz`,
`weekdayInTz`, `startOfDayInTz`, …). Weekday convention: Sunday = 0.

### Validation

zod schemas in `src/lib/schemas/` are the single source of truth, shared by the
client form and the Server Action. The server **always re-validates** with
`schema.safeParse` — client validation is never trusted.

### Environment

`src/lib/env.ts` zod-validates env vars. `publicEnv` is parsed at import (crashes
on boot if a `NEXT_PUBLIC_*` var is missing); `getServerEnv()` is lazy and throws
if called from the browser. Add new vars to both `env.ts` and `.env.local.example`.

## Key domain logic

### Availability (`src/lib/db/availability.ts`)

`computeAvailableSlots` is a **pure function** (no DB, fully unit-tested):
walks each opening block in `stepMin` increments (default 15 min), drops slots
that overlap an occupied interval or fall inside the lead time (default 2 h).
`getAvailableSlots` wraps it with the DB fetches (opening hours, time-off,
existing bookings + per-service buffer).

### Booking concurrency (`src/actions/booking.ts`)

Two customers can race for the same slot. Defence is layered:

1. **DB**: a GIST exclusion constraint `bookings_no_overlap` makes overlapping
   active bookings impossible. A conflicting insert fails with Postgres `23P01`,
   detected by `isExclusionViolation` → returns `{ ok: false, code: "SLOT_TAKEN" }`.
2. **Idempotency**: each booking carries a client-generated `idempotency_key`
   (UUID); a retry with the same key returns the existing booking, no duplicate.
3. **Server is the authority**: `createBooking` re-runs `getAvailableSlots` and
   rejects any slot the canonical algorithm does not currently offer — posted
   times from the client are never trusted. The same re-check guards
   `rescheduleOwnBooking`.

Post-insert steps (audit log, emails, waitlist backfill) are wrapped in a `safe()`
helper so a failing email never rolls back a successful booking.

### Email (`src/lib/email/client.ts`)

Transactional mail goes out over **SMTP via nodemailer** (not Resend, despite
older docs). If SMTP env vars are unset, sends are **silently skipped** — a
missing mail setup must never block a booking or lead. Every send attempt is
recorded in the `email_log` table for admin visibility and one-click resend.

### Spam protection

Public forms (`createBooking`, `createLead`) use a **honeypot field** named
`website` (a filled value silently fails) plus IP **rate limiting**
(`src/lib/rate-limit.ts`: Upstash Redis when configured, otherwise a per-process
in-memory store). There is no CAPTCHA/Turnstile.

### Cron

`vercel.json` schedules `/api/cron/reminders` daily at 08:00. It sends ~24 h
booking reminders, rebooking nudges, and review requests, and purges old chat
threads — all idempotent (a `*_sent_at` column guards each). The route requires
a `CRON_SECRET` Bearer token.

## Database & migrations

- Schema lives in `supabase/migrations/NNNN_*.sql`, applied in numeric order
  (currently up to `0021`). **Never edit a migration that has been applied** to
  staging/prod — add a new numbered file instead.
- `.github/workflows/migrate.yml` runs `supabase db push` automatically on merge
  to `main` when files under `supabase/migrations/**` change (requires the
  `SUPABASE_DB_URL` secret; see the workflow header for the one-time
  baseline-repair note).
- Beyond the original v1 schema, migrations have added: email log, booking
  reminders, reviews, waitlist, editable business settings & site content,
  bridal lead attachments, finance/invoices (BTW, deposits, invoice line items),
  the rebooking nudge, and website chat.

## Tests

Vitest, `node` environment, files in `tests/**/*.test.ts`. `server-only` is
stubbed via `tests/stubs/server-only.ts` (aliased in `vitest.config.ts`) so
server modules can be imported directly. Coverage focuses on the risk areas:
availability computation, booking idempotency/race handling, lead creation,
rate limiting, invoice PDF generation, device detection.
