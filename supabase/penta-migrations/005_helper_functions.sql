-- ============================================================
-- Penta Phase 1 — Helper Functions
-- ============================================================

-- ──────────────────────────────────────────────
-- penta.ensure_profile_and_default_pillars
--
-- Idempotent: creates a profile row and the 5 default pillars
-- for a given user if they don't already exist.
-- Called on first Penta visit from the frontend.
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION penta.ensure_profile_and_default_pillars(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = penta, public
AS $$
BEGIN
  -- Create profile if missing
  INSERT INTO penta.profiles (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create default pillars if none exist for this user
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

COMMENT ON FUNCTION penta.ensure_profile_and_default_pillars(UUID)
  IS 'Idempotent setup: creates profile + 5 default pillars for a new Penta user';

-- ──────────────────────────────────────────────
-- penta.copy_task_templates_to_date
--
-- Stamps all active task templates for a user into
-- penta.tasks for a given date. Skips templates already
-- copied to that date (based on template_id).
-- ──────────────────────────────────────────────
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
      user_id,
      local_date,
      title,
      notes,
      default_pillar_key,
      points_value,
      template_id
    )
    SELECT
      p_user_id,
      p_local_date,
      tt.title,
      tt.notes,
      tt.default_pillar_key,
      tt.points_value,
      tt.id
    FROM penta.task_templates tt
    WHERE tt.user_id = p_user_id
      AND tt.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM penta.tasks t
        WHERE t.user_id    = p_user_id
          AND t.local_date = p_local_date
          AND t.template_id = tt.id
      )
    ORDER BY tt.sort_order
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM new_tasks;

  RETURN v_inserted;
END;
$$;

COMMENT ON FUNCTION penta.copy_task_templates_to_date(UUID, DATE)
  IS 'Stamps active task templates into daily tasks for a date. Returns count of new tasks created. Skips duplicates.';
