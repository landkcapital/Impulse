# Penta Database Schema Notes

## Why a Separate Schema?

Penta uses a dedicated PostgreSQL schema (`penta`) rather than prefixed tables in the `public` schema. Reasons:

1. **Clean namespace isolation** — Penta tables are fully separated from Impulse and other StringerOS products that share the same Supabase project. No risk of naming collisions.
2. **Independent permissions** — Grants and default privileges are scoped to the `penta` schema, so future products don't accidentally inherit Penta's access rules.
3. **Easier auditing** — `\dt penta.*` shows only Penta tables. No need to filter by prefix.
4. **Schema-level operations** — Dropping or backing up the entire Penta data set is a single `DROP SCHEMA penta CASCADE` or `pg_dump -n penta`.
5. **PostgREST isolation** — The Supabase JS client accesses Penta via `supabase.schema('penta').from('table')`, keeping API calls explicit about which product they target.

## Tables

| Table                    | Purpose                                           | Has `user_id`? |
|--------------------------|---------------------------------------------------|----------------|
| `penta.profiles`         | Per-user settings (timezone, increments, prefs)   | Yes (PK)       |
| `penta.pillars`          | The 5 life pillars (customisable per user)        | Yes             |
| `penta.task_templates`   | Reusable daily task definitions                   | Yes             |
| `penta.tasks`            | Concrete daily tasks for a specific date          | Yes             |
| `penta.time_blocks`      | Retrospective time-block log entries              | Yes             |
| `penta.block_pillar_points` | How points from a block split across pillars   | No (via parent) |
| `penta.block_photos`     | Photo references attached to time blocks          | Yes             |
| `penta.daily_reviews`    | End-of-day reflection + tomorrow intent           | Yes             |

## Row Ownership

- **Direct ownership**: Most tables have a `user_id` column. RLS policies use `auth.uid() = user_id`.
- **Indirect ownership**: `block_pillar_points` has no `user_id`. Its RLS policy checks ownership via the parent `time_blocks` row:
  ```sql
  EXISTS (
    SELECT 1 FROM penta.time_blocks tb
    WHERE tb.id = block_id AND tb.user_id = auth.uid()
  )
  ```
- **Profiles cannot be deleted** via the API — there is no DELETE policy. They are cascade-deleted only when the `auth.users` row is removed.
- **Block photos cannot be updated** — they are immutable references. Delete and re-create if needed.

## Helper Functions

### `penta.ensure_profile_and_default_pillars(p_user_id UUID)`

Idempotent first-time setup. Call from the frontend when a user first accesses Penta.

- Creates a `penta.profiles` row with defaults if none exists
- Creates the 5 default pillars if the user has zero pillars

Default pillars and their colours:

| Key            | Name            | Colour    |
|----------------|-----------------|-----------|
| `work`         | Work            | `#6366f1` |
| `health`       | Health          | `#14b8a6` |
| `relationships`| Relationships   | `#f59e0b` |
| `growth`       | Personal Growth | `#ec4899` |
| `admin`        | Life Admin      | `#8b5cf6` |

Both functions use `SECURITY DEFINER` so they bypass RLS — the frontend calls them via `supabase.schema('penta').rpc('ensure_profile_and_default_pillars', { p_user_id })`.

### `penta.copy_task_templates_to_date(p_user_id UUID, p_local_date DATE)`

Stamps all active task templates into `penta.tasks` for a given date. Skips templates that were already copied to that date (deduplication via `template_id`). Returns the count of newly created tasks.

## Supabase JS Client Usage

Because Penta lives in a custom schema, frontend queries must specify the schema:

```js
// Standard table query
const { data } = await supabase
  .schema('penta')
  .from('pillars')
  .select('*');

// RPC call
const { data } = await supabase
  .schema('penta')
  .rpc('ensure_profile_and_default_pillars', { p_user_id: user.id });
```

## Manual Supabase Steps Required

After running the SQL:

1. **Expose the `penta` schema to PostgREST**:
   - Go to Supabase Dashboard > Project Settings > API > Exposed schemas
   - Add `penta` to the comma-separated list (alongside `public`)
   - Save and wait for the API to reload

2. **(Optional) Create a storage bucket** for block photos:
   - Bucket name: `penta-photos`
   - Public: `false` (use signed URLs)

## Migration Files

Located in `supabase/penta-migrations/`:

| File                       | Purpose                                |
|----------------------------|----------------------------------------|
| `000_full_setup.sql`       | Complete copy-paste-safe setup file    |
| `001_schema_and_tables.sql`| Schema creation + all 8 table DDLs     |
| `002_indexes.sql`          | All indexes                            |
| `003_triggers.sql`         | `set_updated_at` function + triggers   |
| `004_rls_policies.sql`     | RLS enable + all ownership policies    |
| `005_helper_functions.sql` | Seed and template-copy helper functions|

For first-time setup, use `000_full_setup.sql`. The numbered files exist for reference and future incremental changes.
