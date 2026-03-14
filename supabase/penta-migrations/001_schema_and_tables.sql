-- ============================================================
-- Penta Phase 1 — Schema & Tables
-- Run in Supabase SQL Editor (StringerOS project)
-- ============================================================

-- Create dedicated penta schema
CREATE SCHEMA IF NOT EXISTS penta;

-- ============================================================
-- 1. penta.profiles — per-user settings & preferences
-- ============================================================
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

COMMENT ON TABLE penta.profiles IS 'Per-user Penta preferences and display settings';

-- ============================================================
-- 2. penta.pillars — the 5 life pillars (user-customisable)
-- ============================================================
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

COMMENT ON TABLE penta.pillars IS 'Five life pillars per user — work, health, relationships, growth, admin';

-- ============================================================
-- 3. penta.task_templates — reusable task definitions
-- ============================================================
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

COMMENT ON TABLE penta.task_templates IS 'Reusable daily task templates that can be stamped onto a date';

-- ============================================================
-- 4. penta.tasks — daily task instances
-- ============================================================
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

COMMENT ON TABLE penta.tasks IS 'Concrete daily tasks — either from templates or ad-hoc';

-- ============================================================
-- 5. penta.time_blocks — retrospective time-block logs
-- ============================================================
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

COMMENT ON TABLE penta.time_blocks IS 'Retrospective time blocks — what was done and when';

-- ============================================================
-- 6. penta.block_pillar_points — pillar point splits per block
-- ============================================================
CREATE TABLE IF NOT EXISTS penta.block_pillar_points (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id    UUID        NOT NULL REFERENCES penta.time_blocks(id) ON DELETE CASCADE,
  pillar_id   UUID        NOT NULL REFERENCES penta.pillars(id) ON DELETE CASCADE,
  points      INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_block_pillar UNIQUE (block_id, pillar_id)
);

COMMENT ON TABLE penta.block_pillar_points IS 'How points from a time block are distributed across pillars';

-- ============================================================
-- 7. penta.block_photos — photos attached to time blocks
-- ============================================================
CREATE TABLE IF NOT EXISTS penta.block_photos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id      UUID        NOT NULL REFERENCES penta.time_blocks(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path  TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE penta.block_photos IS 'Photo references for time blocks (stored in Supabase Storage)';

-- ============================================================
-- 8. penta.daily_reviews — end-of-day reflection
-- ============================================================
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

COMMENT ON TABLE penta.daily_reviews IS 'One reflection per user per day';
