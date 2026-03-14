-- ============================================================
-- Penta Phase 1 — Indexes
-- ============================================================

-- profiles: primary key covers user_id lookups

-- pillars
CREATE INDEX IF NOT EXISTS idx_pillars_user
  ON penta.pillars (user_id);

-- task_templates
CREATE INDEX IF NOT EXISTS idx_task_templates_user
  ON penta.task_templates (user_id);

CREATE INDEX IF NOT EXISTS idx_task_templates_user_active
  ON penta.task_templates (user_id) WHERE is_active = true;

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_date
  ON penta.tasks (user_id, local_date);

CREATE INDEX IF NOT EXISTS idx_tasks_template
  ON penta.tasks (template_id) WHERE template_id IS NOT NULL;

-- time_blocks
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date
  ON penta.time_blocks (user_id, local_date);

CREATE INDEX IF NOT EXISTS idx_time_blocks_user_start
  ON penta.time_blocks (user_id, start_at);

CREATE INDEX IF NOT EXISTS idx_time_blocks_task
  ON penta.time_blocks (task_id) WHERE task_id IS NOT NULL;

-- block_pillar_points
CREATE INDEX IF NOT EXISTS idx_block_pillar_points_block
  ON penta.block_pillar_points (block_id);

CREATE INDEX IF NOT EXISTS idx_block_pillar_points_pillar
  ON penta.block_pillar_points (pillar_id);

-- block_photos
CREATE INDEX IF NOT EXISTS idx_block_photos_block
  ON penta.block_photos (block_id);

CREATE INDEX IF NOT EXISTS idx_block_photos_user
  ON penta.block_photos (user_id);

-- daily_reviews
CREATE INDEX IF NOT EXISTS idx_daily_reviews_user_date
  ON penta.daily_reviews (user_id, local_date);
