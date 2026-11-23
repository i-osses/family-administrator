# Family Administrator

A bilingual (**English & Spanish**) household management web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase** (Auth, PostgreSQL with Row Level Security, and Storage), and **Resend** for email invitations.

## Features

- **Google OAuth Authentication (`/`, `/login`, `/auth/callback`)** — Secure SSR authentication via `@supabase/ssr` with automatic dashboard redirect and seamless return to invitation acceptance links (`/invite/[token]`).
- **Two-Tier Navigation & Admin Module Visibility (`/dashboard`, `/dashboard/family`)** — Separates the shared **Family Hub** (Calendar, Family Pulse Feed, admin-enabled optional modules) from each member's strictly private **My Space**. Family admins can toggle which optional modules appear on the Family Hub overview (shared Family Budget is hidden by default).
- **Family Setup & Spotlight Management (`/dashboard/family`)** — Create and switch between multiple family groups, upload custom household spotlight banners to the public `spotlight-banners` Supabase Storage bucket, manage member roles (`admin` / `member`), and send bilingual email invitations via Resend (`/api/invite`).
- **Shared Family Calendar (`/dashboard/calendar`)** — Interactive monthly grid and chronological agenda views with color-coded categories, family member assignments, filters, optional sharing to Family Pulse, and full event CRUD.
- **Family Pulse Private Social Feed (`/dashboard/memories`)** — Private family-only chronological feed for photos, memories, shared calendar events, celebrated habit milestones, and privacy-enhanced embedded YouTube videos (`youtube-nocookie.com`) with reactions and comments.
- **Private My Space (`/dashboard/my-space`)** — Strictly private to each authenticated user (`user_id = auth.uid()` RLS):
  - **Pay-Yourself-First Bucket Budget:** Automatically splits personal income across Tithing (min 10%), Investment (min 10%), Savings (min 10%), and Free to Spend (remainder), with smart bucket disbursements, recurring expenses/subscriptions, and net remaining balance tracking.
  - **Personal Habits, Tasks & Reminders:** Daily/weekly routines, one-off tasks, custom reminder times, streaks, strictly private notes, and optional milestone sharing to Family Pulse.
- **Bilingual UI (EN / ES)** — Complete English and Spanish translations persisted in `localStorage` and synced to `profiles.preferred_language`.
- **Mobile-First Experience** — Anti-zoom viewport and 16px mobile inputs, overflow-safe mobile modals, fixed bottom tab bar on mobile, and two-tier desktop sidebar.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Backend & Auth:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Email Invitations:** Resend (`resend`)
- **Icons:** Lucide React

---

## Setup Guide

### 1. Clone & Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL (`https://<ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase project anonymous/public key. |
| `RESEND_API_KEY` | Yes (for email delivery) | Resend API key (`re_...`) used by `POST /api/invite`. |
| `RESEND_FROM_EMAIL` | Optional | Verified sender address (defaults to `Family Administrator <onboarding@resend.dev>`). |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL used for OAuth callbacks and invite links (e.g. `http://localhost:3000`). |

### 3. Apply the Supabase Database Schema

1. Open your Supabase project dashboard and navigate to **SQL Editor**.
2. For a **fresh project**, paste and run [`supabase/schema.sql`](./supabase/schema.sql). For an **existing project**, run [`supabase/migrations/20261122_my_space_and_family_pulse.sql`](./supabase/migrations/20261122_my_space_and_family_pulse.sql).
3. Both scripts are idempotent and configure strict Row Level Security separating shared `family_id` tables (`families`, `family_members`, `family_module_settings`, `family_invitations`, `calendar_events`, `family_feed_posts`, `family_feed_reactions`, `family_feed_comments`, `activity_memories`, `budget_entries`) from strictly private `user_id = auth.uid()` tables (`personal_budget_settings`, `personal_income_entries`, `personal_recurring_expenses`, `personal_bucket_transactions`, `personal_habits`), plus the public `spotlight-banners` Storage bucket.

### 4. Enable Google OAuth in Supabase

1. In Supabase Dashboard, go to **Authentication → Providers → Google** and enable Google.
2. Add your Google Cloud OAuth Client ID and Client Secret.
3. Under **Authentication → URL Configuration**:
   - Set **Site URL** to your `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` for local dev).
   - Add `<NEXT_PUBLIC_APP_URL>/auth/callback` (e.g. `http://localhost:3000/auth/callback`) to **Redirect URLs**.

### 5. Configure Resend

1. Create an API key in [Resend](https://resend.com) and add it as `RESEND_API_KEY` in `.env.local`.
2. For production delivery to arbitrary email addresses, verify your sending domain in Resend and set `RESEND_FROM_EMAIL` (for example, `Family Administrator <invites@yourdomain.com>`).

### 6. Run Locally

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Verification Commands

```bash
# Type-check with TypeScript
npx tsc --noEmit

# Lint the codebase
npm run lint

# Build for production
npm run build
```

## Project Structure

```text
├── supabase/
│   └── schema.sql                       # Complete idempotent schema, triggers, RLS, & storage policies
├── public/
│   └── images/family-home-hero.jpg      # Default household hero & spotlight banner
├── src/
│   ├── proxy.ts                         # Next.js 16 session refresh & route guard
│   ├── types/database.ts                # TypeScript models matching PostgreSQL tables
│   ├── lib/
│   │   ├── constants.ts                 # Category palettes & budget presets
│   │   ├── supabase/                    # Browser, server, proxy, & env helpers
│   │   └── i18n/                        # EN/ES dictionaries & LanguageProvider
│   ├── components/
│   │   ├── ui/                          # Modal, Avatar, BrandMark, LanguageToggle, ToastProvider
│   │   ├── auth/                        # GoogleSignInButton, LoginCard
│   │   ├── landing/                     # Editorial LandingView
│   │   ├── invite/                      # InviteAcceptanceView
│   │   └── dashboard/                   # FamilyProvider, DashboardShell, NoFamilyState
│   └── app/
│       ├── page.tsx                     # Landing page (redirects to /dashboard if signed in)
│       ├── login/page.tsx               # Google OAuth login page
│       ├── auth/callback/route.ts       # OAuth code exchange & redirect handler
│       ├── invite/[token]/page.tsx      # Invitation preview & acceptance flow
│       ├── api/invite/route.ts          # Create invitation & send email via Resend
│       ├── api/invite/accept/route.ts   # Accept invitation via Supabase RPC
│       └── dashboard/
│           ├── layout.tsx               # Authenticated shell with FamilyProvider
│           ├── page.tsx                 # Overview with spotlight banner & live summaries
│           ├── family/page.tsx          # Family creation, banner upload, members, & invites
│           ├── calendar/page.tsx        # Monthly & agenda shared family calendar
│           ├── memories/page.tsx        # Searchable activity & memory log
│           └── budget/page.tsx          # Income/expense tracker & category breakdowns
└── .env.example
```
