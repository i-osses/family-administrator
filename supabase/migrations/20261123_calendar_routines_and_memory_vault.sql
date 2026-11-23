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
