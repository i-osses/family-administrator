-- ============================================================================
-- Family Administrator — Complete, Idempotent Supabase Schema
-- Includes tables, indexes, triggers, helper functions, RLS policies, and
-- Storage policies for the public `spotlight-banners` bucket.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- User profiles (auto-populated on auth.users signup via trigger)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  preferred_language text NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'es')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Families
CREATE TABLE IF NOT EXISTS public.families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  spotlight_banner_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Family membership & roles
CREATE TABLE IF NOT EXISTS public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (family_id, user_id)
);

-- Email invitations to join a family
CREATE TABLE IF NOT EXISTS public.family_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Shared family calendar events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  category text NOT NULL DEFAULT 'family' CHECK (
    category IN ('family', 'school', 'health', 'chores', 'celebration', 'travel', 'other')
  ),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CHECK (end_time >= start_time)
);

-- Family activity & memory log
CREATE TABLE IF NOT EXISTS public.activity_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  notes text,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  tags text[] NOT NULL DEFAULT '{}',
  photo_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Personal & family budget entries
CREATE TABLE IF NOT EXISTS public.budget_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL CHECK (char_length(trim(category)) > 0),
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  description text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_families_created_by ON public.families (created_by);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON public.family_members (family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members (user_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_family_id ON public.family_invitations (family_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_token ON public.family_invitations (token);
CREATE INDEX IF NOT EXISTS idx_family_invitations_email_status ON public.family_invitations (lower(invited_email), status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_family_start ON public.calendar_events (family_id, start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_assigned_to ON public.calendar_events (assigned_to);
CREATE INDEX IF NOT EXISTS idx_activity_memories_family_date ON public.activity_memories (family_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_memories_tags ON public.activity_memories USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_budget_entries_family_date ON public.budget_entries (family_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_budget_entries_family_type ON public.budget_entries (family_id, type);

-- ============================================================================
-- 3. HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- Check if the current authenticated user belongs to a given family
CREATE OR REPLACE FUNCTION public.is_family_member(target_family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = target_family_id
      AND fm.user_id = auth.uid()
  );
$$;

-- Check if the current authenticated user is an admin of a given family
CREATE OR REPLACE FUNCTION public.is_family_admin(target_family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = target_family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'admin'
  );
$$;

-- Check if the current authenticated user shares at least one family with target_user_id
CREATE OR REPLACE FUNCTION public.shares_family_with(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members fm_self
    INNER JOIN public.family_members fm_other
      ON fm_self.family_id = fm_other.family_id
    WHERE fm_self.user_id = auth.uid()
      AND fm_other.user_id = target_user_id
  );
$$;

-- Auto-create a profile row when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lang text;
BEGIN
  v_lang := COALESCE(NEW.raw_user_meta_data ->> 'preferred_language', 'en');
  IF v_lang NOT IN ('en', 'es') THEN
    v_lang := 'en';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(COALESCE(NEW.email, 'member'), '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    ),
    v_lang
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-add the family creator as an admin member upon family creation
CREATE OR REPLACE FUNCTION public.handle_new_family()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.family_members (family_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin')
    ON CONFLICT (family_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_family_created ON public.families;
CREATE TRIGGER on_family_created
  AFTER INSERT ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_family();

-- Public-safe invitation preview lookup by token (for /invite/[token])
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invite_token text)
RETURNS TABLE (
  id uuid,
  family_id uuid,
  family_name text,
  spotlight_banner_url text,
  invited_email text,
  role text,
  status text,
  inviter_name text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fi.id,
    fi.family_id,
    f.name AS family_name,
    f.spotlight_banner_url,
    fi.invited_email,
    fi.role,
    fi.status,
    COALESCE(p.full_name, p.email) AS inviter_name,
    fi.created_at
  FROM public.family_invitations fi
  INNER JOIN public.families f ON f.id = fi.family_id
  LEFT JOIN public.profiles p ON p.id = fi.invited_by
  WHERE fi.token = invite_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;

-- Accept a pending invitation as the authenticated user
CREATE OR REPLACE FUNCTION public.accept_family_invitation(invite_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_invite public.family_invitations%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to accept invitation';
  END IF;

  SELECT *
  INTO v_invite
  FROM public.family_invitations
  WHERE token = invite_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF v_invite.status = 'expired' THEN
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  IF v_invite.status = 'accepted' THEN
    -- If user is already a member, return family_id idempotently
    IF EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_id = v_invite.family_id AND user_id = v_user_id
    ) THEN
      RETURN v_invite.family_id;
    END IF;
    RAISE EXCEPTION 'Invitation has already been accepted';
  END IF;

  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (v_invite.family_id, v_user_id, v_invite.role)
  ON CONFLICT (family_id, user_id) DO NOTHING;

  UPDATE public.family_invitations
  SET status = 'accepted'
  WHERE id = v_invite.id;

  RETURN v_invite.family_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_family_invitation(text) TO authenticated;

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;

-- ---- profiles ----
DROP POLICY IF EXISTS "Users can view own and family members profiles" ON public.profiles;
CREATE POLICY "Users can view own and family members profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.shares_family_with(id));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---- families ----
DROP POLICY IF EXISTS "Family members can view their families" ON public.families;
CREATE POLICY "Family members can view their families"
  ON public.families FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR public.is_family_member(id));

DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;
CREATE POLICY "Authenticated users can create families"
  ON public.families FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Family members can update their family" ON public.families;
CREATE POLICY "Family members can update their family"
  ON public.families FOR UPDATE
  TO authenticated
  USING (public.is_family_member(id))
  WITH CHECK (public.is_family_member(id));

DROP POLICY IF EXISTS "Family admins can delete their family" ON public.families;
CREATE POLICY "Family admins can delete their family"
  ON public.families FOR DELETE
  TO authenticated
  USING (public.is_family_admin(id));

-- ---- family_members ----
DROP POLICY IF EXISTS "Family members can view roster" ON public.family_members;
CREATE POLICY "Family members can view roster"
  ON public.family_members FOR SELECT
  TO authenticated
  USING (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Family admins can add members" ON public.family_members;
CREATE POLICY "Family admins can add members"
  ON public.family_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_family_admin(family_id));

DROP POLICY IF EXISTS "Family admins can update member roles" ON public.family_members;
CREATE POLICY "Family admins can update member roles"
  ON public.family_members FOR UPDATE
  TO authenticated
  USING (public.is_family_admin(family_id))
  WITH CHECK (public.is_family_admin(family_id));

DROP POLICY IF EXISTS "Admins can remove members or users can leave" ON public.family_members;
CREATE POLICY "Admins can remove members or users can leave"
  ON public.family_members FOR DELETE
  TO authenticated
  USING (public.is_family_admin(family_id) OR user_id = auth.uid());

-- ---- family_invitations ----
DROP POLICY IF EXISTS "Family members can view invitations" ON public.family_invitations;
CREATE POLICY "Family members can view invitations"
  ON public.family_invitations FOR SELECT
  TO authenticated
  USING (
    public.is_family_member(family_id)
    OR lower(invited_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Family members can create invitations" ON public.family_invitations;
CREATE POLICY "Family members can create invitations"
  ON public.family_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_family_member(family_id)
    AND invited_by = auth.uid()
  );

DROP POLICY IF EXISTS "Family admins can update invitations" ON public.family_invitations;
CREATE POLICY "Family admins can update invitations"
  ON public.family_invitations FOR UPDATE
  TO authenticated
  USING (public.is_family_admin(family_id) OR invited_by = auth.uid())
  WITH CHECK (public.is_family_admin(family_id) OR invited_by = auth.uid());

DROP POLICY IF EXISTS "Family admins can delete invitations" ON public.family_invitations;
CREATE POLICY "Family admins can delete invitations"
  ON public.family_invitations FOR DELETE
  TO authenticated
  USING (public.is_family_admin(family_id) OR invited_by = auth.uid());

-- ---- calendar_events ----
DROP POLICY IF EXISTS "Family members can view calendar events" ON public.calendar_events;
CREATE POLICY "Family members can view calendar events"
  ON public.calendar_events FOR SELECT
  TO authenticated
  USING (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Family members can create calendar events" ON public.calendar_events;
CREATE POLICY "Family members can create calendar events"
  ON public.calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_family_member(family_id)
    AND (created_by IS NULL OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Family members can update calendar events" ON public.calendar_events;
CREATE POLICY "Family members can update calendar events"
  ON public.calendar_events FOR UPDATE
  TO authenticated
  USING (public.is_family_member(family_id))
  WITH CHECK (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Family members can delete calendar events" ON public.calendar_events;
CREATE POLICY "Family members can delete calendar events"
  ON public.calendar_events FOR DELETE
  TO authenticated
  USING (public.is_family_member(family_id));

-- ---- activity_memories ----
DROP POLICY IF EXISTS "Family members can view memories" ON public.activity_memories;
CREATE POLICY "Family members can view memories"
  ON public.activity_memories FOR SELECT
  TO authenticated
  USING (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Family members can create memories" ON public.activity_memories;
CREATE POLICY "Family members can create memories"
  ON public.activity_memories FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_family_member(family_id)
    AND (created_by IS NULL OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Family members can update memories" ON public.activity_memories;
CREATE POLICY "Family members can update memories"
  ON public.activity_memories FOR UPDATE
  TO authenticated
  USING (public.is_family_member(family_id))
  WITH CHECK (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Family members can delete memories" ON public.activity_memories;
CREATE POLICY "Family members can delete memories"
  ON public.activity_memories FOR DELETE
  TO authenticated
  USING (public.is_family_member(family_id));

-- ---- budget_entries ----
DROP POLICY IF EXISTS "Family members can view budget entries" ON public.budget_entries;
CREATE POLICY "Family members can view budget entries"
  ON public.budget_entries FOR SELECT
  TO authenticated
  USING (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Family members can create budget entries" ON public.budget_entries;
CREATE POLICY "Family members can create budget entries"
  ON public.budget_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_family_member(family_id)
    AND (created_by IS NULL OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Family members can update budget entries" ON public.budget_entries;
CREATE POLICY "Family members can update budget entries"
  ON public.budget_entries FOR UPDATE
  TO authenticated
  USING (public.is_family_member(family_id))
  WITH CHECK (public.is_family_member(family_id));

DROP POLICY IF EXISTS "Family members can delete budget entries" ON public.budget_entries;
CREATE POLICY "Family members can delete budget entries"
  ON public.budget_entries FOR DELETE
  TO authenticated
  USING (public.is_family_member(family_id));

-- ============================================================================
-- 5. STORAGE BUCKET & POLICIES (`spotlight-banners`)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('spotlight-banners', 'spotlight-banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read access for banners in the public spotlight-banners bucket
DROP POLICY IF EXISTS "Anyone can view spotlight banners" ON storage.objects;
CREATE POLICY "Anyone can view spotlight banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'spotlight-banners');

-- Authenticated family members can upload banners under `<family_id>/...`
DROP POLICY IF EXISTS "Family members can upload spotlight banners" ON storage.objects;
CREATE POLICY "Family members can upload spotlight banners"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'spotlight-banners'
    AND split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.is_family_member(split_part(name, '/', 1)::uuid)
  );

-- Authenticated family members can update their family's spotlight banners
DROP POLICY IF EXISTS "Family members can update spotlight banners" ON storage.objects;
CREATE POLICY "Family members can update spotlight banners"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'spotlight-banners'
    AND split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.is_family_member(split_part(name, '/', 1)::uuid)
  )
  WITH CHECK (
    bucket_id = 'spotlight-banners'
    AND split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.is_family_member(split_part(name, '/', 1)::uuid)
  );

-- Authenticated family members can delete their family's spotlight banners
DROP POLICY IF EXISTS "Family members can delete spotlight banners" ON storage.objects;
CREATE POLICY "Family members can delete spotlight banners"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'spotlight-banners'
    AND split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.is_family_member(split_part(name, '/', 1)::uuid)
  );

-- ============================================================================
-- 6. MY SPACE (PRIVATE) & FAMILY PULSE (SHARED FEED + MODULE VISIBILITY)
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

CREATE TABLE IF NOT EXISTS public.family_feed_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.family_feed_posts(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('heart', 'celebrate')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (post_id, user_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS public.family_feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.family_feed_posts(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) > 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Strictly private personal bucket budget settings (minimum 10% each)
CREATE TABLE IF NOT EXISTS public.personal_budget_settings (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tithing_pct numeric(5, 2) NOT NULL DEFAULT 10 CHECK (tithing_pct >= 10),
  investment_pct numeric(5, 2) NOT NULL DEFAULT 10 CHECK (investment_pct >= 10),
  savings_pct numeric(5, 2) NOT NULL DEFAULT 10 CHECK (savings_pct >= 10),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CHECK (tithing_pct + investment_pct + savings_pct <= 100)
);

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

ALTER TABLE public.family_module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_feed_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_budget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_bucket_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_habits ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Users can manage own personal budget settings" ON public.personal_budget_settings;
CREATE POLICY "Users can manage own personal budget settings"
  ON public.personal_budget_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own personal income entries" ON public.personal_income_entries;
CREATE POLICY "Users can manage own personal income entries"
  ON public.personal_income_entries FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own personal recurring expenses" ON public.personal_recurring_expenses;
CREATE POLICY "Users can manage own personal recurring expenses"
  ON public.personal_recurring_expenses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own personal bucket transactions" ON public.personal_bucket_transactions;
CREATE POLICY "Users can manage own personal bucket transactions"
  ON public.personal_bucket_transactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own personal habits" ON public.personal_habits;
CREATE POLICY "Users can manage own personal habits"
  ON public.personal_habits FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- ============================================================================
-- Migration: Custom Calendar Categories, Recurring Routines & Visibility,
-- Personal-First Memory Vault with Copy-on-Confirm Tagging, Connected
-- Memory Comments, and Shared Family Goals.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CUSTOM CALENDAR CATEGORIES & RECURRING/VISIBILITY CALENDAR FIELDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.family_calendar_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  color text NOT NULL DEFAULT '#2D5A47',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (family_id, name)
);

CREATE INDEX IF NOT EXISTS idx_family_calendar_categories_family
  ON public.family_calendar_categories (family_id, name);

-- Allow custom category names on calendar_events by dropping the legacy fixed CHECK constraint
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  FOR v_constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    INNER JOIN pg_class rel ON rel.oid = con.conrelid
    INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'calendar_events'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%category%IN%'
  LOOP
    EXECUTE format('ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS %I', v_constraint_name);
  END LOOP;
END;
$$;

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS category_color text,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'family',
  ADD COLUMN IF NOT EXISTS recurrence_rule text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_days integer[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recurrence_end_date date;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'calendar_events_visibility_check'
  ) THEN
    ALTER TABLE public.calendar_events
      ADD CONSTRAINT calendar_events_visibility_check
      CHECK (visibility IN ('family', 'private'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'calendar_events_recurrence_rule_check'
  ) THEN
    ALTER TABLE public.calendar_events
      ADD CONSTRAINT calendar_events_recurrence_rule_check
      CHECK (recurrence_rule IN ('none', 'daily', 'weekly', 'monthly'));
  END IF;
END;
$$;

-- Seed default starter calendar categories for new & existing families
CREATE OR REPLACE FUNCTION public.handle_new_family_calendar_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.family_calendar_categories (family_id, name, color, created_by)
  VALUES
    (NEW.id, 'Family', '#2D5A47', NEW.created_by),
    (NEW.id, 'School', '#3B6998', NEW.created_by),
    (NEW.id, 'Church', '#9E4F73', NEW.created_by),
    (NEW.id, 'Activities', '#C86D51', NEW.created_by)
  ON CONFLICT (family_id, name) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_family_created_calendar_categories ON public.families;
CREATE TRIGGER on_family_created_calendar_categories
  AFTER INSERT ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_family_calendar_categories();

INSERT INTO public.family_calendar_categories (family_id, name, color, created_by)
SELECT f.id, starter.name, starter.color, f.created_by
FROM public.families f
CROSS JOIN (
  VALUES
    ('Family', '#2D5A47'),
    ('School', '#3B6998'),
    ('Church', '#9E4F73'),
    ('Activities', '#C86D51')
) AS starter(name, color)
ON CONFLICT (family_id, name) DO NOTHING;

-- ============================================================================
-- 2. SHARED FAMILY GOALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.family_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  category text NOT NULL DEFAULT 'spiritual' CHECK (
    category IN ('spiritual', 'learning', 'adventure', 'health', 'other')
  ),
  target_count integer NOT NULL DEFAULT 5 CHECK (target_count >= 1),
  notes text,
  is_completed boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_family_goals_family
  ON public.family_goals (family_id, created_at DESC);

ALTER TABLE public.family_feed_posts
  ADD COLUMN IF NOT EXISTS family_goal_id uuid REFERENCES public.family_goals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_family_feed_posts_goal
  ON public.family_feed_posts (family_goal_id)
  WHERE family_goal_id IS NOT NULL;

-- ============================================================================
-- 3. PERSONAL-FIRST MEMORY VAULT (OWNED BY user_id = auth.uid())
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.personal_memory_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  template_type text NOT NULL DEFAULT 'general' CHECK (
    template_type IN ('media', 'location', 'general')
  ),
  color text NOT NULL DEFAULT '#2D5A47',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_personal_memory_categories_user
  ON public.personal_memory_categories (user_id, name);

-- Personal memories owned strictly by user_id.
-- source_memory_id uses ON DELETE SET NULL so deleting the creator's memory
-- NEVER cascades to delete confirmed copies in tagged members' vaults.
CREATE TABLE IF NOT EXISTS public.personal_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id uuid REFERENCES public.families(id) ON DELETE SET NULL,
  category_name text NOT NULL DEFAULT 'Family Milestone',
  template_type text NOT NULL DEFAULT 'general' CHECK (
    template_type IN ('media', 'location', 'general')
  ),
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  occurred_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  rating integer CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  notes text,
  location_name text,
  latitude double precision,
  longitude double precision,
  photo_url text,
  tags text[] NOT NULL DEFAULT '{}',
  shared_to_feed boolean NOT NULL DEFAULT false,
  shared_feed_post_id uuid REFERENCES public.family_feed_posts(id) ON DELETE SET NULL,
  family_goal_id uuid REFERENCES public.family_goals(id) ON DELETE SET NULL,
  source_memory_id uuid REFERENCES public.personal_memories(id) ON DELETE SET NULL,
  thread_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_personal_memories_user_occurred
  ON public.personal_memories (user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_personal_memories_thread
  ON public.personal_memories (thread_id);
CREATE INDEX IF NOT EXISTS idx_personal_memories_source
  ON public.personal_memories (source_memory_id)
  WHERE source_memory_id IS NOT NULL;

-- Memory tagging with Copy-on-Confirm ownership semantics
CREATE TABLE IF NOT EXISTS public.personal_memory_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid REFERENCES public.personal_memories(id) ON DELETE SET NULL,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  tagged_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tagged_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  copied_memory_id uuid REFERENCES public.personal_memories(id) ON DELETE SET NULL,
  memory_title_snapshot text NOT NULL,
  memory_category_snapshot text NOT NULL DEFAULT 'Family Milestone',
  memory_occurred_at_snapshot timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  confirmed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_personal_memory_tags_unique
  ON public.personal_memory_tags (memory_id, tagged_user_id)
  WHERE memory_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_personal_memory_tags_tagged_user
  ON public.personal_memory_tags (tagged_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_personal_memory_tags_memory
  ON public.personal_memory_tags (memory_id);

-- Shared comments connected via thread_id across original memory & confirmed copies
CREATE TABLE IF NOT EXISTS public.personal_memory_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  memory_id uuid REFERENCES public.personal_memories(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) > 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_personal_memory_comments_thread
  ON public.personal_memory_comments (thread_id, created_at ASC);

-- ============================================================================
-- 4. HELPER FUNCTIONS & COPY-ON-CONFIRM RPC
-- ============================================================================

-- Check if current user owns a memory belonging to a given comment thread
CREATE OR REPLACE FUNCTION public.can_access_memory_thread(p_thread_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.personal_memories pm
    WHERE pm.thread_id = p_thread_id
      AND pm.user_id = auth.uid()
  );
$$;

-- Copy-on-confirm RPC: clones the tagged memory into the tagged user's own
-- personal_memories vault linked via source_memory_id (ON DELETE SET NULL)
-- and shared thread_id so comments remain connected.
CREATE OR REPLACE FUNCTION public.confirm_memory_tag(p_tag_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_tag public.personal_memory_tags%ROWTYPE;
  v_source public.personal_memories%ROWTYPE;
  v_new_memory_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO v_tag
  FROM public.personal_memory_tags
  WHERE id = p_tag_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Memory tag not found';
  END IF;

  IF v_tag.tagged_user_id <> v_user_id THEN
    RAISE EXCEPTION 'Not authorized to confirm this tag';
  END IF;

  IF v_tag.status = 'confirmed' AND v_tag.copied_memory_id IS NOT NULL THEN
    RETURN v_tag.copied_memory_id;
  END IF;

  IF v_tag.memory_id IS NOT NULL THEN
    SELECT *
    INTO v_source
    FROM public.personal_memories
    WHERE id = v_tag.memory_id;
  END IF;

  IF v_source.id IS NOT NULL THEN
    INSERT INTO public.personal_memories (
      user_id,
      family_id,
      category_name,
      template_type,
      title,
      occurred_at,
      rating,
      notes,
      location_name,
      latitude,
      longitude,
      photo_url,
      tags,
      shared_to_feed,
      family_goal_id,
      source_memory_id,
      thread_id
    )
    VALUES (
      v_user_id,
      v_tag.family_id,
      v_source.category_name,
      v_source.template_type,
      v_source.title,
      v_source.occurred_at,
      NULL,
      v_source.notes,
      v_source.location_name,
      v_source.latitude,
      v_source.longitude,
      v_source.photo_url,
      v_source.tags,
      false,
      v_source.family_goal_id,
      v_source.id,
      v_source.thread_id
    )
    RETURNING id INTO v_new_memory_id;
  ELSE
    -- Source was already deleted before confirmation; still preserve snapshot in tagged member's vault
    INSERT INTO public.personal_memories (
      user_id,
      family_id,
      category_name,
      template_type,
      title,
      occurred_at,
      shared_to_feed
    )
    VALUES (
      v_user_id,
      v_tag.family_id,
      v_tag.memory_category_snapshot,
      'general',
      v_tag.memory_title_snapshot,
      v_tag.memory_occurred_at_snapshot,
      false
    )
    RETURNING id INTO v_new_memory_id;
  END IF;

  UPDATE public.personal_memory_tags
  SET
    status = 'confirmed',
    copied_memory_id = v_new_memory_id,
    confirmed_at = timezone('utc', now())
  WHERE id = v_tag.id;

  RETURN v_new_memory_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_memory_tag(uuid) TO authenticated;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.family_calendar_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_memory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_memory_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_memory_comments ENABLE ROW LEVEL SECURITY;

-- ---- family_calendar_categories ----
DROP POLICY IF EXISTS "Family members can manage calendar categories" ON public.family_calendar_categories;
CREATE POLICY "Family members can manage calendar categories"
  ON public.family_calendar_categories FOR ALL
  TO authenticated
  USING (public.is_family_member(family_id))
  WITH CHECK (public.is_family_member(family_id));

-- ---- calendar_events (Updated to strictly protect Private visibility) ----
DROP POLICY IF EXISTS "Family members can view calendar events" ON public.calendar_events;
CREATE POLICY "Family members can view calendar events"
  ON public.calendar_events FOR SELECT
  TO authenticated
  USING (
    public.is_family_member(family_id)
    AND (visibility = 'family' OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Family members can create calendar events" ON public.calendar_events;
CREATE POLICY "Family members can create calendar events"
  ON public.calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_family_member(family_id)
    AND (created_by IS NULL OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Family members can update calendar events" ON public.calendar_events;
CREATE POLICY "Family members can update calendar events"
  ON public.calendar_events FOR UPDATE
  TO authenticated
  USING (
    public.is_family_member(family_id)
    AND (visibility = 'family' OR created_by = auth.uid())
  )
  WITH CHECK (
    public.is_family_member(family_id)
    AND (visibility = 'family' OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Family members can delete calendar events" ON public.calendar_events;
CREATE POLICY "Family members can delete calendar events"
  ON public.calendar_events FOR DELETE
  TO authenticated
  USING (
    public.is_family_member(family_id)
    AND (visibility = 'family' OR created_by = auth.uid())
  );

-- ---- family_goals ----
DROP POLICY IF EXISTS "Family members can manage family goals" ON public.family_goals;
CREATE POLICY "Family members can manage family goals"
  ON public.family_goals FOR ALL
  TO authenticated
  USING (public.is_family_member(family_id))
  WITH CHECK (public.is_family_member(family_id));

-- ---- personal_memory_categories (Strictly private: user_id = auth.uid()) ----
DROP POLICY IF EXISTS "Users can manage own memory categories" ON public.personal_memory_categories;
CREATE POLICY "Users can manage own memory categories"
  ON public.personal_memory_categories FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- personal_memories (Strictly private: user_id = auth.uid()) ----
DROP POLICY IF EXISTS "Users can manage own personal memories" ON public.personal_memories;
CREATE POLICY "Users can manage own personal memories"
  ON public.personal_memories FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- personal_memory_tags ----
DROP POLICY IF EXISTS "Users can view tags they created or received" ON public.personal_memory_tags;
CREATE POLICY "Users can view tags they created or received"
  ON public.personal_memory_tags FOR SELECT
  TO authenticated
  USING (tagged_by = auth.uid() OR tagged_user_id = auth.uid());

DROP POLICY IF EXISTS "Memory owners can tag family members" ON public.personal_memory_tags;
CREATE POLICY "Memory owners can tag family members"
  ON public.personal_memory_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    tagged_by = auth.uid()
    AND public.is_family_member(family_id)
    AND EXISTS (
      SELECT 1 FROM public.personal_memories pm
      WHERE pm.id = memory_id AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tag creators or recipients can remove tags" ON public.personal_memory_tags;
CREATE POLICY "Tag creators or recipients can remove tags"
  ON public.personal_memory_tags FOR DELETE
  TO authenticated
  USING (tagged_by = auth.uid() OR tagged_user_id = auth.uid());

-- ---- personal_memory_comments (Connected across original + confirmed copies via thread_id) ----
DROP POLICY IF EXISTS "Thread owners can view memory comments" ON public.personal_memory_comments;
CREATE POLICY "Thread owners can view memory comments"
  ON public.personal_memory_comments FOR SELECT
  TO authenticated
  USING (public.can_access_memory_thread(thread_id));

DROP POLICY IF EXISTS "Thread owners can add memory comments" ON public.personal_memory_comments;
CREATE POLICY "Thread owners can add memory comments"
  ON public.personal_memory_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.can_access_memory_thread(thread_id)
  );

DROP POLICY IF EXISTS "Comment authors can delete own memory comments" ON public.personal_memory_comments;
CREATE POLICY "Comment authors can delete own memory comments"
  ON public.personal_memory_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
