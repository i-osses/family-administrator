# Family Administrator

A bilingual (**English & Spanish**) household management web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase** (Auth, PostgreSQL with Row Level Security, and Storage), and **Resend** for email invitations.

## Features

- **Google OAuth Authentication (`/`, `/login`, `/auth/callback`)** — Secure SSR authentication via `@supabase/ssr` with automatic dashboard redirect and seamless return to invitation acceptance links (`/invite/[token]`).
- **Family Setup & Spotlight Management (`/dashboard/family`)** — Create and switch between multiple family groups, upload custom household spotlight banners to the public `spotlight-banners` Supabase Storage bucket, manage member roles (`admin` / `member`), and send bilingual email invitations via Resend (`/api/invite`).
- **Shared Family Calendar (`/dashboard/calendar`)** — Interactive monthly grid and chronological agenda views with color-coded categories, family member assignments, filters, and full event CRUD.
- **Activity & Memory Log (`/dashboard/memories`)** — Capture family outings, milestones, and notes with dates, searchable tags, optional photo uploads, and sort/filter controls.
- **Personal & Family Budgeting (`/dashboard/budget`)** — Track income and expenses by month or all-time with total income, total expenses, net balance, savings rate, and visual category breakdowns.
- **Bilingual UI (EN / ES)** — Complete English and Spanish translations persisted in `localStorage` and synced to `profiles.preferred_language`.
- **Mobile-First Navigation** — Fixed bottom tab bar on mobile screens, sidebar navigation on desktop, and a top bar with family switcher and EN/ES toggle.

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
2. Paste and run the entire contents of [`supabase/schema.sql`](./supabase/schema.sql).
3. The script is fully idempotent and sets up:
   - Tables: `profiles`, `families`, `family_members`, `family_invitations`, `calendar_events`, `activity_memories`, `budget_entries`
   - Performance indexes on foreign keys, dates, tokens, and tags
   - Triggers: auto-creating a `profiles` record on user signup (`on_auth_user_created`) and auto-assigning the creator as family `admin` (`on_family_created`)
   - RPC helpers: `get_invitation_by_token` and `accept_family_invitation`
   - Row Level Security (RLS) policies on all tables
   - Public `spotlight-banners` Storage bucket and family-scoped upload/read policies

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
