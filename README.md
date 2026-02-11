# ZeroLine

Personal budgeting app built with React + Vite + Supabase.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project dashboard under **Settings > API**.

3. Start the dev server:

```bash
npm run dev
```

## Database

Tables live in the `zeroline` schema:

- `zeroline.budgets` — budget definitions (name, period, goal_amount)
- `zeroline.transactions` — spending records (budget_id, amount, note, occurred_at)
