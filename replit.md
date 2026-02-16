# replit.md

## Overview

Red Bull Invest is a mobile-first investment platform targeting French-speaking West African countries (Togo, Bénin, Côte d'Ivoire, Sénégal, Cameroun). Users can register, deposit funds via mobile money payment methods, invest in tiered VIP plans with daily returns, withdraw earnings, refer others through a multi-level referral system, and play a spin-the-wheel game. The platform includes a full admin dashboard for managing users, transactions, investments, and settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side router, not React Router)
- **State Management**: TanStack React Query for server state; React Context for auth state (`AuthProvider` in `client/src/lib/auth.tsx`)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support), custom design tokens defined in `client/src/index.css`
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **Key pages**: auth, home, invest, invite (referrals), billet (tickets/support), account, game (spin wheel), deposit, withdraw, bank-card, settings, telegram, orders, transactions, balance, about, admin

### Backend Architecture
- **Runtime**: Node.js with Express, written in TypeScript and executed via `tsx`
- **HTTP Server**: Node `http.createServer` wrapping Express (supports potential WebSocket upgrade)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Authentication**: Express-session with cookie-based sessions (using `connect-pg-simple` for PostgreSQL session store). Password hashing via `bcryptjs`. No JWT — sessions only.
- **Authorization**: Middleware functions `requireAuth` and `requireAdmin` check session state
- **File Uploads**: Multer with disk storage, saving to `client/public/uploads/`
- **Development**: Vite dev server integrated as middleware (HMR via `server/vite.ts`)
- **Production**: Vite builds client to `dist/public`; esbuild bundles server to `dist/index.cjs`

### Data Storage
- **Database**: PostgreSQL (required — `DATABASE_URL` environment variable must be set)
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres` driver
- **Schema**: Defined in `shared/schema.ts` using Drizzle's `pgTable` definitions. Key tables:
  - `users` — accounts with balance fields, VIP level, admin/ban/promoter flags
  - `bank_cards` — user payment method info (mobile money)
  - `investments` — active/completed investment plans per user
  - `transactions` — deposits and withdrawals with approval status
  - `referrals` — multi-level referral tracking
  - `spin_results` — spin wheel game results
  - `tickets` — support tickets with image uploads
  - `settings` — global platform settings
- **Migrations**: Managed via `drizzle-kit push` (`npm run db:push`)
- **Storage Layer**: `server/storage.ts` defines an `IStorage` interface abstracting all database operations

### Key Business Logic
- **Investment Plans**: Fixed-duration plans (60/90/180 days) and activity plans (3/5/15/30 days) with VIP tiers 1-7, defined in `client/src/lib/constants.ts`
- **Referral System**: 3-level deep referral commissions (30% / 3% / 2%)
- **Currency**: CFA Franc (FCFA), integer-based amounts (no decimals)
- **Payment Integration**: BKApay for automated deposits (Cameroun), manual deposit/withdrawal approval for other countries
- **Spin Wheel Game**: Users earn spin tickets, prizes range from 0 to 500 FCFA

### Build System
- **Dev**: `npm run dev` — runs tsx with Vite middleware for HMR
- **Build**: `npm run build` — Vite builds frontend, esbuild bundles server with selective dependency bundling
- **Start**: `npm start` — runs production build from `dist/index.cjs`
- **Type Check**: `npm run check` — TypeScript checking without emit

## External Dependencies

### Database
- **PostgreSQL** — primary data store, required via `DATABASE_URL` environment variable
- **connect-pg-simple** — session storage in PostgreSQL

### Payment Gateway
- **BKApay** — mobile money payment processing (live API key stored in client constants for Cameroun deposits)

### Communication
- **Telegram** — customer support and community group links (configurable via settings)

### Key NPM Packages
- `drizzle-orm` + `drizzle-kit` — database ORM and migration tooling
- `express` + `express-session` — HTTP server and session management
- `bcryptjs` — password hashing
- `multer` — file upload handling
- `zod` + `drizzle-zod` — runtime validation
- `@tanstack/react-query` — client-side data fetching and caching
- `wouter` — lightweight client routing
- `lucide-react` — icon library
- Full shadcn/ui component suite (Radix UI primitives)

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string (mandatory)
- `SESSION_SECRET` — Express session secret (has fallback default, should be set in production)