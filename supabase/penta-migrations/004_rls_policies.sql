-- ============================================================
-- Penta Phase 1 — Row Level Security & Policies
-- ============================================================

-- ──────────────────────────────────────────────
-- Enable RLS on all tables
-- ──────────────────────────────────────────────
ALTER TABLE penta.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.pillars            ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.task_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.time_blocks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.block_pillar_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.block_photos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE penta.daily_reviews      ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- penta.profiles
-- ──────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON penta.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON penta.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON penta.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- No delete policy — profiles are permanent

-- ──────────────────────────────────────────────
-- penta.pillars
-- ──────────────────────────────────────────────
CREATE POLICY "pillars_select_own" ON penta.pillars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "pillars_insert_own" ON penta.pillars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pillars_update_own" ON penta.pillars
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "pillars_delete_own" ON penta.pillars
  FOR DELETE USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- penta.task_templates
-- ──────────────────────────────────────────────
CREATE POLICY "task_templates_select_own" ON penta.task_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "task_templates_insert_own" ON penta.task_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "task_templates_update_own" ON penta.task_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "task_templates_delete_own" ON penta.task_templates
  FOR DELETE USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- penta.tasks
-- ──────────────────────────────────────────────
CREATE POLICY "tasks_select_own" ON penta.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_own" ON penta.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_own" ON penta.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tasks_delete_own" ON penta.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- penta.time_blocks
-- ──────────────────────────────────────────────
CREATE POLICY "time_blocks_select_own" ON penta.time_blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "time_blocks_insert_own" ON penta.time_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "time_blocks_update_own" ON penta.time_blocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "time_blocks_delete_own" ON penta.time_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- penta.block_pillar_points
-- Ownership derived from parent time_blocks row
-- ──────────────────────────────────────────────
CREATE POLICY "block_pillar_points_select_own" ON penta.block_pillar_points
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM penta.time_blocks tb
      WHERE tb.id = block_id AND tb.user_id = auth.uid()
    )
  );

CREATE POLICY "block_pillar_points_insert_own" ON penta.block_pillar_points
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM penta.time_blocks tb
      WHERE tb.id = block_id AND tb.user_id = auth.uid()
    )
  );

CREATE POLICY "block_pillar_points_update_own" ON penta.block_pillar_points
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM penta.time_blocks tb
      WHERE tb.id = block_id AND tb.user_id = auth.uid()
    )
  );

CREATE POLICY "block_pillar_points_delete_own" ON penta.block_pillar_points
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM penta.time_blocks tb
      WHERE tb.id = block_id AND tb.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────
-- penta.block_photos
-- Has direct user_id for simpler ownership check
-- ──────────────────────────────────────────────
CREATE POLICY "block_photos_select_own" ON penta.block_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "block_photos_insert_own" ON penta.block_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "block_photos_delete_own" ON penta.block_photos
  FOR DELETE USING (auth.uid() = user_id);

-- No update policy — photos are immutable references

-- ──────────────────────────────────────────────
-- penta.daily_reviews
-- ──────────────────────────────────────────────
CREATE POLICY "daily_reviews_select_own" ON penta.daily_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_reviews_insert_own" ON penta.daily_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_reviews_update_own" ON penta.daily_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "daily_reviews_delete_own" ON penta.daily_reviews
  FOR DELETE USING (auth.uid() = user_id);
