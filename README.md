# Family Administrator

A bilingual (**English & Spanish**) household management web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase** (Auth + native email invitations, PostgreSQL with Row Level Security, and Storage).

## Features

- **Google OAuth & Native Supabase Invitations (`/`, `/login`, `/auth/callback`, `/invite/[token]`)** — Secure SSR authentication via `@supabase/ssr` with automatic dashboard redirect and native Supabase email invitations (`supabase.auth.admin.inviteUserByEmail` with graceful fallback for existing Supabase accounts).
- **Two-Tier Navigation & Admin Module Visibility (`/dashboard`, `/dashboard/family`)** — Separates the shared **Family Hub** (Calendar, Family Pulse Feed, admin-enabled optional modules) from each member's strictly private **My Space**. Family admins can toggle which optional modules appear on the Family Hub overview (shared Family Budget is hidden by default).
- **Shared & Private Family Calendar (`/dashboard/calendar`)** — Interactive monthly grid and agenda views with user-managed custom categories (`family_calendar_categories`), recurring daily/weekly/monthly routines (including multi-day weekly schedules like Tue/Thu), and **Family Calendar** vs. **Private (My Space)** visibility enforced by RLS.
- **Family Pulse Private Social Feed & Shared Family Goals (`/dashboard/memories`)** — Private family-only chronological feed for photos, memories, shared events, habit milestones, and privacy-enhanced embedded YouTube videos (`youtube-nocookie.com`) with reactions, comments, and **Shared Family Goals** linked to shared memories.
- **Private My Space (`/dashboard/my-space`)** — Strictly private to each authenticated user (`user_id = auth.uid()` RLS):
  - **Personal Memory Vault:** Own your memories privately with custom create/delete categories, 2–3 tap smart templates (Movies/Books/Scriptures/Exercise with 1–5 ratings; Hike/Trip with 1-tap GPS pin), instant search, one-tap **Share to Family Pulse**, connected comments, and **Copy-on-Confirm** member tagging (confirming a tag creates a permanent independent copy in the tagged member's vault).
  - **Pay-Yourself-First Bucket Budget:** Automatically splits personal income across Tithing (min 10%), Investment (min 10%), Savings (min 10%), and Free to Spend (remainder), with bucket disbursements and Recurring Expenses & Subscriptions tracking.
  - **Personal Habits, Tasks & Reminders:** Daily/weekly routines, one-off tasks, custom reminder times, streaks, private notes, and optional milestone sharing to Family Pulse.
- **Mobile-First Zero-Scroll Experience** — Viewport zoom disabled, 16px mobile inputs, strict scroll-locked zero-scroll mobile modal sheets, and responsive bottom tab bar + two-tier desktop sidebar.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Backend, Auth & Email:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Icons:** Lucide React

---

## Setup Guide

### 1. Install Dependencies

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
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for email invites) | Server-only Supabase Service Role key used by `POST /api/invite` for native `auth.admin.inviteUserByEmail`. |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL used for OAuth callbacks and invitation links (e.g. `http://localhost:3000`). |

### 3. Apply the Supabase Database Schema / Migrations

1. Open your Supabase project dashboard and navigate to **SQL Editor**.
2. For a **fresh project**, run [`supabase/schema.sql`](./supabase/schema.sql).
3. For an **existing project**, run the migrations in order:
   - [`supabase/migrations/20261122_my_space_and_family_pulse.sql`](./supabase/migrations/20261122_my_space_and_family_pulse.sql)
   - [`supabase/migrations/20261123_calendar_routines_and_memory_vault.sql`](./supabase/migrations/20261123_calendar_routines_and_memory_vault.sql)
4. All SQL scripts are idempotent and enforce strict Row Level Security separating private `user_id = auth.uid()` tables from shared `family_id` tables, including the `confirm_memory_tag` copy-on-confirm RPC and the public `spotlight-banners` Storage bucket.

### 4. Enable Google OAuth & Redirect URLs in Supabase

1. In Supabase Dashboard, go to **Authentication → Providers → Google** and enable Google with your OAuth Client ID and Secret.
2. Under **Authentication → URL Configuration**:
   - Set **Site URL** to your `NEXT_PUBLIC_APP_URL`.
   - Add `<NEXT_PUBLIC_APP_URL>/auth/callback` and `<NEXT_PUBLIC_APP_URL>/invite/*` to **Redirect URLs**.

### 5. Run & Verify

```bash
# Development server
npm run dev

# Verification checks
npx tsc --noEmit
npm run lint
npm run build
```
