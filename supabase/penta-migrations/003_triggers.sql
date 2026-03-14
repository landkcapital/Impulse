-- ============================================================
-- Penta Phase 1 — Trigger Functions & Triggers
-- ============================================================

-- Reusable updated_at trigger function in the penta schema
CREATE OR REPLACE FUNCTION penta.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION penta.set_updated_at()
  IS 'Automatically sets updated_at to now() on row update';

-- Apply to all tables that have an updated_at column

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON penta.profiles
  FOR EACH ROW
  EXECUTE FUNCTION penta.set_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON penta.tasks
  FOR EACH ROW
  EXECUTE FUNCTION penta.set_updated_at();

CREATE TRIGGER trg_time_blocks_updated_at
  BEFORE UPDATE ON penta.time_blocks
  FOR EACH ROW
  EXECUTE FUNCTION penta.set_updated_at();

CREATE TRIGGER trg_daily_reviews_updated_at
  BEFORE UPDATE ON penta.daily_reviews
  FOR EACH ROW
  EXECUTE FUNCTION penta.set_updated_at();
