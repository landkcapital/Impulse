# Penta Phase 1 — Architecture Notes

## Where Penta Lives

Penta is a feature module at `src/features/penta/`, isolated from the existing Impulse app code.

```
src/
├── components/        # Shared UI (Header, ErrorBoundary, Loading)
├── lib/               # Shared infra (supabase client, auth helpers)
├── pages/             # Impulse screens (Home, Goals, History, Settings, Account)
├── styles.css         # Shared theme/design tokens (CSS variables)
└── features/
    └── penta/
        ├── screens/   # Page-level components (PentaHome, LogBlock, Review, Settings)
        ├── components/# Penta-specific UI components
        ├── lib/       # Penta business logic helpers
        ├── api/       # Supabase queries for Penta tables
        ├── hooks/     # Custom React hooks
        ├── store/     # State management (if needed beyond useState)
        └── types/     # Type definitions / constants (pillars, enums)
```

## Routes

Penta routes are mounted under `/penta/*` in `App.jsx`:

| Route              | Screen              | Purpose                      |
|--------------------|---------------------|------------------------------|
| `/penta`           | PentaHomeScreen     | Dashboard / daily overview   |
| `/penta/log`       | PentaLogBlockScreen | Retrospective time-block log |
| `/penta/review`    | PentaReviewScreen   | Rolling balance & review     |
| `/penta/settings`  | PentaSettingsScreen | Pillar config & preferences  |

## What Was Reused from Impulse

- **Supabase client** (`src/lib/supabase.js`) — single shared client, same Supabase project
- **Auth helpers** (`src/lib/auth.js`) — signIn, signOut, getSession, onAuthStateChange
- **ProtectedRoute / PublicRoute** pattern from `App.jsx`
- **CSS design tokens** — `styles.css` CSS variables (colors, radii, shadows, spacing)
- **Shared components** — ErrorBoundary, Loading
- **Vite + React Router** build setup

## What Was Intentionally Kept Separate

- **No Impulse business logic reuse** — `src/lib/impulses.js` is Impulse-specific (goals, impulse logging, scores). Penta will have its own data layer in `features/penta/api/`.
- **No shared Header nav (yet)** — Impulse Header is hardcoded to Impulse routes. Penta will need its own navigation when the UI is built out. A product-switcher or unified nav can be added later.
- **No shared state** — Impulse uses raw useState. Penta can adopt its own state pattern in `features/penta/store/` without coupling to Impulse.
- **Dedicated `penta` database schema** — Penta uses its own PostgreSQL schema (`penta.*`) rather than prefixed tables in `public`. This provides clean namespace isolation, independent permissions, and explicit API calls via `supabase.schema('penta')`. See `docs/penta-schema-notes.md` for full details.

## Tech Stack (inherited)

- React 19 + Vite 7
- React Router DOM 7
- Supabase JS v2
- Plain CSS with CSS custom properties
- No TypeScript (JSX/JS)
- No state management library

## Recommended Next Build Sequence

1. ~~**Define the 5 pillars**~~ — Done via `penta.ensure_profile_and_default_pillars()` seed function
2. ~~**Design Supabase schema**~~ — Done: 8 tables in dedicated `penta` schema (see `docs/penta-schema-notes.md`)
3. **Run `000_full_setup.sql`** in Supabase SQL Editor + expose `penta` schema in API settings
4. **Build PentaHomeScreen** — daily pillar balance view with placeholder data
5. **Build PentaLogBlockScreen** — retrospective time-block entry form (pillar, duration, notes)
6. **Wire up Supabase API layer** — CRUD in `features/penta/api/`
7. **Add Penta navigation** — product-switcher or dedicated Penta nav bar
8. **Build PentaReviewScreen** — rolling daily/weekly balance visualization
9. **PentaSettingsScreen** — pillar customization, preferences
