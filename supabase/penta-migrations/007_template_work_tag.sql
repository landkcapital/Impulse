-- ============================================================
-- 007 — Add work_tag to task_templates
-- Allows non-negotiable templates to carry a Founder Mode tag
-- ============================================================

ALTER TABLE penta.task_templates
  ADD COLUMN IF NOT EXISTS work_tag TEXT NULL;

ALTER TABLE penta.task_templates
  ADD CONSTRAINT chk_task_templates_work_tag
  CHECK (work_tag IS NULL OR work_tag IN ('sales', 'marketing', 'product', 'operations'));

COMMENT ON COLUMN penta.task_templates.work_tag IS 'Optional sub-pillar tag for Work templates: sales, marketing, product, operations';
