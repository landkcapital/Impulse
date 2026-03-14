-- ============================================================
-- 006 — Add work_tag to tasks and time_blocks
-- Supports Founder Mode: sub-pillar tracking within Work
-- ============================================================

-- Add work_tag to tasks
ALTER TABLE penta.tasks
  ADD COLUMN IF NOT EXISTS work_tag TEXT NULL;

-- Add work_tag to time_blocks
ALTER TABLE penta.time_blocks
  ADD COLUMN IF NOT EXISTS work_tag TEXT NULL;

-- Constrain allowed values on tasks
ALTER TABLE penta.tasks
  ADD CONSTRAINT chk_tasks_work_tag
  CHECK (work_tag IS NULL OR work_tag IN ('sales', 'marketing', 'product', 'operations'));

-- Constrain allowed values on time_blocks
ALTER TABLE penta.time_blocks
  ADD CONSTRAINT chk_time_blocks_work_tag
  CHECK (work_tag IS NULL OR work_tag IN ('sales', 'marketing', 'product', 'operations'));

-- Index for efficient work tag aggregation queries
CREATE INDEX IF NOT EXISTS idx_time_blocks_work_tag
  ON penta.time_blocks (local_date, work_tag)
  WHERE work_tag IS NOT NULL;

COMMENT ON COLUMN penta.tasks.work_tag IS 'Optional sub-pillar tag for Work tasks: sales, marketing, product, operations';
COMMENT ON COLUMN penta.time_blocks.work_tag IS 'Optional sub-pillar tag for Work time blocks: sales, marketing, product, operations';
