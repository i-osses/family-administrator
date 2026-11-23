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
