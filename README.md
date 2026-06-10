# PA Bell-to-Bell Tracker

An interactive, auto-updating tracker of Pennsylvania schools and districts with
**bell-to-bell** cell phone policies — phones away from the first bell to the last.
A project of [PA Unplugged](https://paunplugged.org).

Live: **b2btracker.paunplugged.org** · Admin: **/admin**

## What it does

- **Map + filters** — every tracked school as a pin colored by storage method
  (Yondr / lockers / staff-collected / off-and-away / mixed), plus search and
  filters by method, type, county, and effective year.
- **Detail cards** — policy language with a "copy" button (a copy-paste toolkit
  for other districts), district contact, and source links.
- **Submit a school** — public form → lands in the review queue.
- **/admin** — password-gated review queue + add/edit/delete; publishing commits
  back to this repo.
- **Weekly discovery** — a GitHub Action searches the web for new PA bell-to-bell
  schools and drops candidates into the review queue (never auto-published).

## Architecture

`schools.json` is the **source of truth** (committed to this repo). There is no
database. The site is a static Vite + React SPA; a few Vercel serverless
functions in `/api` handle the writes that need the GitHub token server-side.

```
public/data/schools.json   ← published data the site reads (source of truth)
public/data/pending.json   ← review queue (submissions + discovered candidates)

/api/submit.js             ← public form → appends to pending.json
/api/admin-login.js        ← checks ADMIN_PASSWORD, sets a signed cookie
/api/admin-save.js         ← writes schools.json/pending.json via the GitHub API
scripts/discover.js        ← weekly web-search job (Claude) → pending.json
scripts/migrate-from-xlsx.py ← one-time import from the original spreadsheet
```

Every admin edit and every approved submission is a real git commit, which
triggers a Vercel redeploy (~30s to go live).

## Local development

```bash
npm install
npm run dev          # the public site
```

The `/api` functions only run on Vercel (or `vercel dev`). The public site reads
the static JSON, so `npm run dev` is enough for front-end work.

## Deploy (Vercel)

1. Import the repo into Vercel (framework auto-detected; build → `dist`).
2. Set the environment variables from `.env.example`:
   - `ADMIN_PASSWORD` — your admin login.
   - `GITHUB_TOKEN` — a fine-grained PAT with **Contents: Read and write** scoped
     to **only** this repo. This is what makes the site the source of truth.
   - `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_BRANCH` if they differ from defaults.
3. Add the custom domain `b2btracker.paunplugged.org` (CNAME to Vercel, same as
   your other subdomains).

## Weekly discovery setup (optional, Phase 2)

1. Add an `ANTHROPIC_API_KEY` **GitHub Actions secret** (repo → Settings →
   Secrets → Actions).
2. The workflow `.github/workflows/discover.yml` runs Mondays at 7am ET. Trigger
   it manually anytime via the Actions tab → Weekly Discovery → Run workflow.
3. Candidates show up in `/admin` under the review queue for you to approve.

## Re-running the spreadsheet import

The site replaced the original Google Sheet. If you ever need to re-import from
the original `.xlsx`:

```bash
python3 scripts/migrate-from-xlsx.py "/path/to/PA Unplugged BELL TO BELL School Policy Tracker.xlsx"
```
