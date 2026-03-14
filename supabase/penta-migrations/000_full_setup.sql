-- ============================================================
-- PENTA FULL SCHEMA SETUP
-- Copy-paste this entire file into the Supabase SQL Editor
-- and run it once to set up the complete Penta schema.
--
-- Safe to re-run: uses IF NOT EXISTS and ON CONFLICT
-- ============================================================


-- ============================================================
-- PART 1: Schema & Tables
-- ============================================================

CREATE SCHEMA IF NOT EXISTS penta;

-- 1. profiles
CREATE TABLE IF NOT EXISTS penta.profiles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  display_name            TEXT        NULL,
  timezone                TEXT        NOT NULL DEFAULT 'Australia/Brisbane',
  day_start_time          TIME        NOT NULL DEFAULT '05:00',
  increment_minutes       INTEGER     NOT NULL DEFAULT 15,
  notifications_enabled   BOOLEAN     NOT NULL DEFAULT true,
  active_hours_start      TIME        NOT NULL DEFAULT '07:00',
  active_hours_end        TIME        NOT NULL DEFAULT '22:00',
  allow_dual_pillar_logging BOOLEAN   NOT NULL DEFAULT true
);

-- 2. pillars
CREATE TABLE IF NOT EXISTS penta.pillars (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key         TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  colour      TEXT        NOT NULL,
  sort_order  INTEGER     NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_pillars_user_key        UNIQUE (user_id, key),
  CONSTRAINT uq_pillars_user_sort_order UNIQUE (user_id, sort_order)
);

-- 3. task_templates
CREATE TABLE IF NOT EXISTS penta.task_templates (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               TEXT        NOT NULL,
  notes               TEXT        NULL,
  default_pillar_key  TEXT        NULL,
  points_value        INTEGER     NULL,
  is_active           BOOLEAN     NOT NULL DEFAULT true,
  sort_order          INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. tasks
CREATE TABLE IF NOT EXISTS penta.tasks (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_date          DATE        NOT NULL,
  title               TEXT        NOT NULL,
  notes               TEXT        NULL,
  is_non_negotiable   BOOLEAN     NOT NULL DEFAULT false,
  is_done             BOOLEAN     NOT NULL DEFAULT false,
  done_at             TIMESTAMPTZ NULL,
  default_pillar_key  TEXT        NULL,
  points_value        INTEGER     NULL,
  template_id         UUID        NULL REFERENCES penta.task_templates(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. time_blocks
CREATE TABLE IF NOT EXISTS penta.time_blocks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_at      TIMESTAMPTZ NOT NULL,
  end_at        TIMESTAMPTZ NOT NULL,
  local_date    DATE        NOT NULL,
  summary       TEXT        NOT NULL,
  task_id       UUID        NULL REFERENCES penta.tasks(id) ON DELETE SET NULL,
  total_points  INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_time_blocks_end_after_start CHECK (end_at > start_at)
);

-- 6. block_pillar_points
CREATE TABLE IF NOT EXISTS penta.block_pillar_points (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id    UUID        NOT NULL REFERENCES penta.time_blocks(id) ON DELETE CASCADE,
  pillar_id   UUID        NOT NULL REFERENCES penta.pillars(id) ON DELETE CASCADE,
  points      INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_block_pillar UNIQUE (block_id, pillar_id)
);

-- 7. block_photos
CREATE TABLE IF NOT EXISTS penta.block_photos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id      UUID        NOT NULL REFERENCES penta.time_blocks(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path  TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. daily_reviews
CREATE TABLE IF NOT EXISTS penta.daily_reviews (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_date            DATE        NOT NULL,
  reflection_text       TEXT        NULL,
  tomorrow_intent_text  TEXT        NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_daily_reviews_user_date UNIQUE (user_id, local_date)
);


-- ============================================================
-- PART 2: Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_pillars_user
  ON penta.pillars (user_id);

CREATE INDEX IF NOT EXISTS idx_task_templates_user
  ON penta.task_templates (user_id);

CREATE INDEX IF NOT EXISTS idx_task_templates_user_active
  ON penta.task_templates (user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tasks_user_date
  ON penta.tasks (user_id, local_date);

CREATE INDEX IF NOT EXISTS idx_tasks_template
  ON penta.tasks (template_id) WHERE template_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date
  ON penta.time_blocks (user_id, local_date);

CREATE INDEX IF NOT EXISTS idx_time_blocks_user_start
  ON penta.time_blocks (user_id, start_at);

CREATE INDEX IF NOT EXISTS idx_time_blocks_task
  ON penta.time_blocks (task_id) WHERE task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_block_pillar_points_block
  ON penta.block_pillar_points (block_id);

CREATE INDEX IF NOT EXISTS idx_block_pillar_points_pillar
  ON penta.block_pillar_points (pillar_id);

CREATE INDEX IF NOT EXISTS idx_block_photos_block
  ON penta.block_photos (block_id);

CREATE INDEX IF NOT EXISTS idx_block_photos_user
  ON penta.block_photos (user_id);

CREATE INDEX IF NOT EXISTS idx_daily_reviews_user_date
  ON penta.daily_reviews (user_id, local_date);


-- ============================================================
-- PART 3: Trigger Function & Triggers
-- ============================================================

CREATE OR REPLACE FUNCTION penta.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop-and-recreate triggers to make this file safe to re-run
DROP TRIGGER IF EXISTS trg_profiles_updated_at     ON penta.profiles;
DROP TRIGGER IF EXISTS trg_tasks_updated_at        ON penta.tasks;
DROP TRIGGER IF EXISTS trg_time_blocks_updated_at  ON penta.time_blocks;
DROP TRIGGER IF EXISTS trg_daily_reviews_updated_at ON penta.daily_reviews;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON penta.profiles
  FOR EACH ROW EXECUTE FUNCTION penta.set_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON penta.tasks
  FOR EACH ROW EXECUTE FUNCTION penta.set_updated_at();

CREATE TRIGGER trg_time_blocks_updated_at
  BEFORE UPDATE ON penta.time_blocks
  FOR EACH ROW EXECUTE FUNCTION penta.set_updated_at();

CREATE TRIGGER trg_daily_reviews_updated_at
  BEFORE UPDATE ON penta.daily_reviews
  FOR EACH ROW EXECUTE FUNCTION penta.set_updated_at();


-- ============================================================
-- PART 4: Row Level Security
-- ============================================================

ALTER TABLE penta.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.pillars            ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.task_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.time_blocks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.block_pillar_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.block_photos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.daily_reviews      ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON penta.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON penta.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON penta.profiles;

CREATE POLICY "profiles_select_own" ON penta.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON penta.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON penta.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- pillars
DROP POLICY IF EXISTS "pillars_select_own" ON penta.pillars;
DROP POLICY IF EXISTS "pillars_insert_own" ON penta.pillars;
DROP POLICY IF EXISTS "pillars_update_own" ON penta.pillars;
DROP POLICY IF EXISTS "pillars_delete_own" ON penta.pillars;

CREATE POLICY "pillars_select_own" ON penta.pillars
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pillars_insert_own" ON penta.pillars
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pillars_update_own" ON penta.pillars
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pillars_delete_own" ON penta.pillars
  FOR DELETE USING (auth.uid() = user_id);

-- task_templates
DROP POLICY IF EXISTS "task_templates_select_own" ON penta.task_templates;
DROP POLICY IF EXISTS "task_templates_insert_own" ON penta.task_templates;
DROP POLICY IF EXISTS "task_templates_update_own" ON penta.task_templates;
DROP POLICY IF EXISTS "task_templates_delete_own" ON penta.task_templates;

CREATE POLICY "task_templates_select_own" ON penta.task_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "task_templates_insert_own" ON penta.task_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "task_templates_update_own" ON penta.task_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "task_templates_delete_own" ON penta.task_templates
  FOR DELETE USING (auth.uid() = user_id);

-- tasks
DROP POLICY IF EXISTS "tasks_select_own" ON penta.tasks;
DROP POLICY IF EXISTS "tasks_insert_own" ON penta.tasks;
DROP POLICY IF EXISTS "tasks_update_own" ON penta.tasks;
DROP POLICY IF EXISTS "tasks_delete_own" ON penta.tasks;

CREATE POLICY "tasks_select_own" ON penta.tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_own" ON penta.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON penta.tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete_own" ON penta.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- time_blocks
DROP POLICY IF EXISTS "time_blocks_select_own" ON penta.time_blocks;
DROP POLICY IF EXISTS "time_blocks_insert_own" ON penta.time_blocks;
DROP POLICY IF EXISTS "time_blocks_update_own" ON penta.time_blocks;
DROP POLICY IF EXISTS "time_blocks_delete_own" ON penta.time_blocks;

CREATE POLICY "time_blocks_select_own" ON penta.time_blocks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "time_blocks_insert_own" ON penta.time_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "time_blocks_update_own" ON penta.time_blocks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "time_blocks_delete_own" ON penta.time_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- block_pillar_points (ownership via parent time_blocks)
DROP POLICY IF EXISTS "block_pillar_points_select_own" ON penta.block_pillar_points;
DROP POLICY IF EXISTS "block_pillar_points_insert_own" ON penta.block_pillar_points;
DROP POLICY IF EXISTS "block_pillar_points_update_own" ON penta.block_pillar_points;
DROP POLICY IF EXISTS "block_pillar_points_delete_own" ON penta.block_pillar_points;

CREATE POLICY "block_pillar_points_select_own" ON penta.block_pillar_points
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM penta.time_blocks tb WHERE tb.id = block_id AND tb.user_id = auth.uid())
  );
CREATE POLICY "block_pillar_points_insert_own" ON penta.block_pillar_points
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM penta.time_blocks tb WHERE tb.id = block_id AND tb.user_id = auth.uid())
  );
CREATE POLICY "block_pillar_points_update_own" ON penta.block_pillar_points
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM penta.time_blocks tb WHERE tb.id = block_id AND tb.user_id = auth.uid())
  );
CREATE POLICY "block_pillar_points_delete_own" ON penta.block_pillar_points
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM penta.time_blocks tb WHERE tb.id = block_id AND tb.user_id = auth.uid())
  );

-- block_photos
DROP POLICY IF EXISTS "block_photos_select_own" ON penta.block_photos;
DROP POLICY IF EXISTS "block_photos_insert_own" ON penta.block_photos;
DROP POLICY IF EXISTS "block_photos_delete_own" ON penta.block_photos;

CREATE POLICY "block_photos_select_own" ON penta.block_photos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "block_photos_insert_own" ON penta.block_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "block_photos_delete_own" ON penta.block_photos
  FOR DELETE USING (auth.uid() = user_id);

-- daily_reviews
DROP POLICY IF EXISTS "daily_reviews_select_own" ON penta.daily_reviews;
DROP POLICY IF EXISTS "daily_reviews_insert_own" ON penta.daily_reviews;
DROP POLICY IF EXISTS "daily_reviews_update_own" ON penta.daily_reviews;
DROP POLICY IF EXISTS "daily_reviews_delete_own" ON penta.daily_reviews;

CREATE POLICY "daily_reviews_select_own" ON penta.daily_reviews
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_reviews_insert_own" ON penta.daily_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_reviews_update_own" ON penta.daily_reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "daily_reviews_delete_own" ON penta.daily_reviews
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- PART 5: Helper Functions
-- ============================================================

CREATE OR REPLACE FUNCTION penta.ensure_profile_and_default_pillars(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = penta, public
AS $$
BEGIN
  INSERT INTO penta.profiles (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1 FROM penta.pillars WHERE user_id = p_user_id
  ) THEN
    INSERT INTO penta.pillars (user_id, key, name, colour, sort_order) VALUES
      (p_user_id, 'work',          'Work',            '#6366f1', 0),
      (p_user_id, 'health',        'Health',          '#14b8a6', 1),
      (p_user_id, 'relationships', 'Relationships',   '#f59e0b', 2),
      (p_user_id, 'growth',        'Personal Growth', '#ec4899', 3),
      (p_user_id, 'admin',         'Life Admin',      '#8b5cf6', 4);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION penta.copy_task_templates_to_date(
  p_user_id    UUID,
  p_local_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = penta, public
AS $$
DECLARE
  v_inserted INTEGER;
BEGIN
  WITH new_tasks AS (
    INSERT INTO penta.tasks (
      user_id, local_date, title, notes,
      default_pillar_key, points_value, template_id
    )
    SELECT
      p_user_id, p_local_date, tt.title, tt.notes,
      tt.default_pillar_key, tt.points_value, tt.id
    FROM penta.task_templates tt
    WHERE tt.user_id = p_user_id
      AND tt.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM penta.tasks t
        WHERE t.user_id     = p_user_id
          AND t.local_date  = p_local_date
          AND t.template_id = tt.id
      )
    ORDER BY tt.sort_order
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM new_tasks;

  RETURN v_inserted;
END;
$$;


-- ============================================================
-- PART 6: Expose penta schema to PostgREST (Supabase API)
-- ============================================================
-- IMPORTANT: This grants the Supabase API roles access to the
-- penta schema so that the JS client can query penta.* tables.
-- Without this, supabase.schema('penta').from('profiles') will
-- return permission errors.
-- ============================================================

GRANT USAGE ON SCHEMA penta TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA penta TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA penta TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA penta TO anon, authenticated, service_role;

-- Make future tables automatically accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA penta
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA penta
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA penta
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;


-- ============================================================
-- DONE. After running this file you must also:
--
-- 1. Go to Supabase Dashboard > Settings > API > Exposed schemas
--    and add "penta" to the list. This lets PostgREST serve
--    the penta schema via the REST API.
--
-- 2. (Optional) Create a "penta-photos" storage bucket if you
--    plan to use block_photos in this phase.
-- ============================================================
