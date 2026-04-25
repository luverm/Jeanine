# Jeanine

Booking & lead platform for Jeanine — hairstylist & bridal stylist.

See [`CLAUDE.md`](./CLAUDE.md) for the full project brief, architecture, schema and roadmap.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (Postgres, Auth, Storage)
- Tailwind CSS v4 + shadcn/ui
- react-hook-form + zod
- Resend for transactional email
- date-fns + date-fns-tz (`Europe/Amsterdam`)

## Local setup

### 1. Prerequisites

- Node 20+ and pnpm 10+
- Docker (for `supabase start`)
- Supabase CLI: <https://supabase.com/docs/guides/cli>

### 2. Install

```bash
pnpm install
cp .env.local.example .env.local
```

### 3. Start Supabase locally

```bash
supabase start
```

This boots Postgres, the auth server, Studio (`http://localhost:54323`) and prints the local anon + service-role keys. Copy them into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase start>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA   # Cloudflare test key
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA   # Cloudflare test key
RESEND_API_KEY=re_test
RESEND_FROM_EMAIL=afspraak@example.com
ADMIN_NOTIFY_EMAIL=jeanine@example.com
```

### 4. Apply migration & seed

```bash
supabase db reset
```

This drops the local DB, replays `supabase/migrations/*.sql`, then runs `supabase/seed.sql`.

### 5. Run the dev server

```bash
pnpm dev
```

Open <http://localhost:3000>. Public pages render immediately. Admin routes (`/dashboard`, `/boekingen`, ...) redirect to `/login` until you authenticate.

### 6. Authenticate as admin

Until the magic-link login UI is built (Phase 5), create an auth user manually:

1. Studio → Authentication → Users → "Add user" → email + temporary password.
2. SQL: link that user to the seeded staff row:
   ```sql
   update staff
     set user_id = '<auth user id>'
     where email = 'jeanine@example.com';
   ```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | ESLint |

## Project layout

See `CLAUDE.md` §4 for the full file tree and conventions.

## Migrations

Every schema change = a new file in `supabase/migrations/`. Never edit existing migrations once they're applied to staging or prod.

```bash
# Generate a new migration file with a timestamp prefix
supabase migration new add_something
```

Apply locally with `supabase db reset` (destructive) or `supabase db push` against a remote project.
