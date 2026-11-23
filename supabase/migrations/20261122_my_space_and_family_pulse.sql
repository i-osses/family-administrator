-- ============================================================================
-- Migration: My Space (Private Personal Tools) & Family Pulse (Shared Feed +
-- Admin Module Visibility)
-- Idempotent migration with strict Row Level Security separating private
-- user_id tables from family_id shared tables.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. SHARED FAMILY TABLES (family_id scoped)
-- ============================================================================

-- Admin-controlled module visibility for each family's shared Hub
CREATE TABLE IF NOT EXISTS public.family_module_settings (
  family_id uuid PRIMARY KEY REFERENCES public.families(id) ON DELETE CASCADE,
  show_calendar boolean NOT NULL DEFAULT true,
  show_family_feed boolean NOT NULL DEFAULT true,
  show_family_budget boolean NOT NULL DEFAULT false,
  show_quick_actions boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Private family social feed posts ("Family Pulse")
CREATE TABLE IF NOT EXISTS public.family_feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  post_type text NOT NULL DEFAULT 'memory' CHECK (
    post_type IN ('memory', 'photo', 'youtube', 'milestone', 'event')
  ),
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  body text,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  tags text[] NOT NULL DEFAULT '{}',
  photo_url text,
  youtube_url text,
  youtube_video_id text,
  milestone_label text,
  calendar_event_id uuid REFERENCES public.calendar_events(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Lightweight family reactions on feed posts
CREATE TABLE IF NOT EXISTS public.family_feed_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.family_feed_posts(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('heart', 'celebrate')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (post_id, user_id, reaction_type)
);

-- Family comments on feed posts
CREATE TABLE IF NOT EXISTS public.family_feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.family_feed_posts(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) > 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================================
-- 2. PRIVATE "MY SPACE" TABLES (strictly user_id = auth.uid())
-- ============================================================================

-- Pay-yourself-first personal percentage allocation settings
-- Tithing, Investment, and Savings each enforce a minimum of 10%.
-- Free to Spend is derived as 100 - (tithing_pct + investment_pct + savings_pct).
CREATE TABLE IF NOT EXISTS public.personal_budget_settings (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tithing_pct numeric(5, 2) NOT NULL DEFAULT 10 CHECK (tithing_pct >= 10),
  investment_pct numeric(5, 2) NOT NULL DEFAULT 10 CHECK (investment_pct >= 10),
  savings_pct numeric(5, 2) NOT NULL DEFAULT 10 CHECK (savings_pct >= 10),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CHECK (tithing_pct + investment_pct + savings_pct <= 100)
);

-- Personal income entries with automatic bucket split snapshots
CREATE TABLE IF NOT EXISTS public.personal_income_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (char_length(trim(source)) > 0),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  tithing_pct numeric(5, 2) NOT NULL CHECK (tithing_pct >= 10),
  investment_pct numeric(5, 2) NOT NULL CHECK (investment_pct >= 10),
  savings_pct numeric(5, 2) NOT NULL CHECK (savings_pct >= 10),
  tithing_amount numeric(12, 2) NOT NULL CHECK (tithing_amount >= 0),
  investment_amount numeric(12, 2) NOT NULL CHECK (investment_amount >= 0),
  savings_amount numeric(12, 2) NOT NULL CHECK (savings_amount >= 0),
  free_to_spend_amount numeric(12, 2) NOT NULL CHECK (free_to_spend_amount >= 0),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Recurring bills & subscriptions applied against Free to Spend
CREATE TABLE IF NOT EXISTS public.personal_recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  frequency text NOT NULL DEFAULT 'monthly' CHECK (
    frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')
  ),
  billing_day integer NOT NULL DEFAULT 1 CHECK (billing_day >= 1 AND billing_day <= 31),
  auto_apply boolean NOT NULL DEFAULT false,
  last_paid_month text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Bucket disbursements (tithing payments, investment transfers, savings withdrawals, everyday expenses)
CREATE TABLE IF NOT EXISTS public.personal_bucket_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bucket text NOT NULL CHECK (
    bucket IN ('tithing', 'investment', 'savings', 'free_to_spend')
  ),
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  recurring_expense_id uuid REFERENCES public.personal_recurring_expenses(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Personal daily/weekly habits and one-off tasks with reminders & streaks
CREATE TABLE IF NOT EXISTS public.personal_habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  kind text NOT NULL DEFAULT 'habit' CHECK (kind IN ('habit', 'task')),
  cadence text NOT NULL DEFAULT 'daily' CHECK (cadence IN ('daily', 'weekly', 'once')),
  category text NOT NULL DEFAULT 'personal' CHECK (
    category IN ('spiritual', 'study', 'music', 'health', 'personal', 'other')
  ),
  reminder_time text,
  due_date date,
  private_notes text,
  allow_milestone_share boolean NOT NULL DEFAULT false,
  current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  best_streak integer NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
  completed_dates text[] NOT NULL DEFAULT '{}',
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_family_feed_posts_family_created
  ON public.family_feed_posts (family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_feed_posts_tags
  ON public.family_feed_posts USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_family_feed_reactions_post
  ON public.family_feed_reactions (post_id);
CREATE INDEX IF NOT EXISTS idx_family_feed_comments_post_created
  ON public.family_feed_comments (post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_personal_income_user_date
  ON public.personal_income_entries (user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_personal_bucket_tx_user_date
  ON public.personal_bucket_transactions (user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_personal_bucket_tx_user_bucket
  ON public.personal_bucket_transactions (user_id, bucket);
CREATE INDEX IF NOT EXISTS idx_personal_recurring_user
  ON public.personal_recurring_expenses (user_id, billing_day ASC);
CREATE INDEX IF NOT EXISTS idx_personal_habits_user_created
  ON public.personal_habits (user_id, created_at DESC);

-- ============================================================================
-- 4. TRIGGERS & BACKFILL FOR DEFAULT MODULE SETTINGS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_family_modules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.family_module_settings (
    family_id,
    show_calendar,
    show_family_feed,
    show_family_budget,
    show_quick_actions,
    updated_by
  )
  VALUES (NEW.id, true, true, false, true, NEW.created_by)
  ON CONFLICT (family_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_family_created_modules ON public.families;
CREATE TRIGGER on_family_created_modules
  AFTER INSERT ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_family_modules();

-- Backfill default module settings for existing families
INSERT INTO public.family_module_settings (
  family_id,
  show_calendar,
  show_family_feed,
  show_family_budget,
  show_quick_actions,
  updated_by
)
SELECT f.id, true, true, false, true, f.created_by
FROM public.families f
ON CONFLICT (family_id) DO NOTHING;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.family_module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_feed_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_feed_comments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.personal_budget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_bucket_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_habits ENABLE ROW LEVEL SECURITY;

-- ---- family_module_settings (Read: members, Write: admins only) ----
DROP POLICY IF EXISTS "Family members can view module settings" ON public.family_module_settings;
CREATE POLICY "Family members can view module settings"
  ON public.family_module_settings FOR SELECT
  TO authenticated
  USING (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Family admins can insert module settings" ON public.family_module_settings;
CREATE POLICY "Family admins can insert module settings"
  ON public.family_module_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_family_admin(family_id));

DROP POLICY IF EXISTS "Family admins can update module settings" ON public.family_module_settings;
CREATE POLICY "Family admins can update module settings"
  ON public.family_module_settings FOR UPDATE
  TO authenticated
  USING (public.is_family_admin(family_id))
  WITH CHECK (public.is_family_admin(family_id));

-- ---- family_feed_posts (Scoped strictly to family members) ----
DROP POLICY IF EXISTS "Family members can view feed posts" ON public.family_feed_posts;
CREATE POLICY "Family members can view feed posts"
  ON public.family_feed_posts FOR SELECT
  TO authenticated
  USING (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Family members can create feed posts" ON public.family_feed_posts;
CREATE POLICY "Family members can create feed posts"
  ON public.family_feed_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_family_member(family_id)
    AND (author_id IS NULL OR author_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authors and admins can update feed posts" ON public.family_feed_posts;
CREATE POLICY "Authors and admins can update feed posts"
  ON public.family_feed_posts FOR UPDATE
  TO authenticated
  USING (
    public.is_family_member(family_id)
    AND (author_id = auth.uid() OR public.is_family_admin(family_id))
  )
  WITH CHECK (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Authors and admins can delete feed posts" ON public.family_feed_posts;
CREATE POLICY "Authors and admins can delete feed posts"
  ON public.family_feed_posts FOR DELETE
  TO authenticated
  USING (
    public.is_family_member(family_id)
    AND (author_id = auth.uid() OR public.is_family_admin(family_id))
  );

-- ---- family_feed_reactions ----
DROP POLICY IF EXISTS "Family members can view feed reactions" ON public.family_feed_reactions;
CREATE POLICY "Family members can view feed reactions"
  ON public.family_feed_reactions FOR SELECT
  TO authenticated
  USING (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Family members can add own feed reactions" ON public.family_feed_reactions;
CREATE POLICY "Family members can add own feed reactions"
  ON public.family_feed_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_family_member(family_id)
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.family_feed_posts p
      WHERE p.id = post_id AND p.family_id = family_id
    )
  );

DROP POLICY IF EXISTS "Users can remove own feed reactions" ON public.family_feed_reactions;
CREATE POLICY "Users can remove own feed reactions"
  ON public.family_feed_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND public.is_family_member(family_id));

-- ---- family_feed_comments ----
DROP POLICY IF EXISTS "Family members can view feed comments" ON public.family_feed_comments;
CREATE POLICY "Family members can view feed comments"
  ON public.family_feed_comments FOR SELECT
  TO authenticated
  USING (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Family members can add feed comments" ON public.family_feed_comments;
CREATE POLICY "Family members can add feed comments"
  ON public.family_feed_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_family_member(family_id)
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.family_feed_posts p
      WHERE p.id = post_id AND p.family_id = family_id
    )
  );

DROP POLICY IF EXISTS "Authors and admins can delete feed comments" ON public.family_feed_comments;
CREATE POLICY "Authors and admins can delete feed comments"
  ON public.family_feed_comments FOR DELETE
  TO authenticated
  USING (
    public.is_family_member(family_id)
    AND (user_id = auth.uid() OR public.is_family_admin(family_id))
  );

-- ---- personal_budget_settings (Strictly private: user_id = auth.uid()) ----
DROP POLICY IF EXISTS "Users can manage own personal budget settings" ON public.personal_budget_settings;
CREATE POLICY "Users can manage own personal budget settings"
  ON public.personal_budget_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- personal_income_entries (Strictly private: user_id = auth.uid()) ----
DROP POLICY IF EXISTS "Users can manage own personal income entries" ON public.personal_income_entries;
CREATE POLICY "Users can manage own personal income entries"
  ON public.personal_income_entries FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- personal_recurring_expenses (Strictly private: user_id = auth.uid()) ----
DROP POLICY IF EXISTS "Users can manage own personal recurring expenses" ON public.personal_recurring_expenses;
CREATE POLICY "Users can manage own personal recurring expenses"
  ON public.personal_recurring_expenses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- personal_bucket_transactions (Strictly private: user_id = auth.uid()) ----
DROP POLICY IF EXISTS "Users can manage own personal bucket transactions" ON public.personal_bucket_transactions;
CREATE POLICY "Users can manage own personal bucket transactions"
  ON public.personal_bucket_transactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- personal_habits (Strictly private: user_id = auth.uid()) ----
DROP POLICY IF EXISTS "Users can manage own personal habits" ON public.personal_habits;
CREATE POLICY "Users can manage own personal habits"
  ON public.personal_habits FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
