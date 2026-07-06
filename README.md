# Fly Weng — Portfolio (local prototype)

Local scaffold for the portfolio site. Vite + React + TypeScript + Tailwind.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL. Move the mouse over the hero to see the
craft.wild.as-style pixel heat interaction.

## What's real vs placeholder

- `src/data/projects.ts` is the single source of truth for selected work.
  Every entry has a `status`: `"ready"` or `"pending-assets"`.
  `kaohsiung-pier2-5g` is marked `pending-assets` because only event photos
  exist right now, not finished design mockups — it still shows on the page
  with an "assets pending" tag rather than being silently removed.
- All `cover` fields are `null` — every project card currently shows a
  placeholder box instead of a real image. Drop real files under
  `public/work/<slug>/` and set `cover` to that path once you have them.
- No admin panel exists yet. This is a static site: content changes happen
  by editing `src/data/projects.ts` (or asking Claude to do it) and
  redeploying. If you want a self-service way to add/remove/reorder
  projects without touching code, that's a separate follow-up (e.g. a
  small password-protected admin page, or a git-based headless CMS like
  Decap CMS) — not built by default.

## Deploy later

1. Push this folder to a GitHub repo.
2. Import the repo in Vercel (free tier). Every push to `main` auto-deploys.
3. Optional: attach a custom domain in Vercel's project settings.
