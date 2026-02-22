-- ============================================================
-- Impulse App Schema
-- Run this in your Supabase SQL Editor (SOS project)
-- ============================================================

-- 1. Goals table (what users are working toward)
CREATE TABLE IF NOT EXISTS impulse_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Impulses table (logged impulse events)
CREATE TABLE IF NOT EXISTS impulses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES impulse_goals(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  impulse_type TEXT NOT NULL CHECK (impulse_type IN ('positive', 'negative')),
  acted_on BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. User settings table (theme preferences)
CREATE TABLE IF NOT EXISTS impulse_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  accent_color TEXT NOT NULL DEFAULT '#a855f7',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE impulse_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE impulses ENABLE ROW LEVEL SECURITY;
ALTER TABLE impulse_settings ENABLE ROW LEVEL SECURITY;

-- Goals policies
CREATE POLICY "Users can view own goals"
  ON impulse_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON impulse_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON impulse_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON impulse_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Impulses policies
CREATE POLICY "Users can view own impulses"
  ON impulses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own impulses"
  ON impulses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own impulses"
  ON impulses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own impulses"
  ON impulses FOR DELETE
  USING (auth.uid() = user_id);

-- Settings policies
CREATE POLICY "Users can view own settings"
  ON impulse_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON impulse_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON impulse_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_impulse_goals_user ON impulse_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_impulses_user ON impulses(user_id);
CREATE INDEX IF NOT EXISTS idx_impulses_goal ON impulses(goal_id);
CREATE INDEX IF NOT EXISTS idx_impulses_created ON impulses(created_at);

-- ============================================================
-- Updated_at trigger for settings
-- ============================================================
CREATE OR REPLACE FUNCTION impulse_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER impulse_settings_updated_at
  BEFORE UPDATE ON impulse_settings
  FOR EACH ROW
  EXECUTE FUNCTION impulse_set_updated_at();
