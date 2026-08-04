# 🚀 Deploying Bhartiya Namo Sangh to Vercel

## What you're deploying

The full frontend (22 pages: public site, member dashboard, admin panel)
plus a working Homepage Slider backed by Redis. Auth, real database records,
and payments are **not yet connected** — those pages are UI-only until
Supabase + NextAuth + Razorpay are wired up in a later step.

---

## Step 1 — Get the code onto GitHub

Vercel deploys from a Git repository, not a single uploaded file. Extract
the zip you downloaded, then from inside the project folder:

```bash
cd bhartiya-namo-sangh
git init
git add .
git commit -m "Initial commit — BNS website"
```

Create a new empty repository on GitHub (no README/license — keep it
empty), then:

```bash
git remote add origin https://github.com/<your-username>/bhartiya-namo-sangh.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Import the project into Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select your GitHub account, choose the `bhartiya-namo-sangh` repo
3. Framework Preset: Vercel auto-detects **Next.js** — leave defaults
4. Don't click Deploy yet — first add the environment variable below

---

## Step 3 — Connect Redis (required for the Homepage Slider)

Without this, the slider will still *build* and *render* fine with its
default slides, but admin edits won't save reliably in production.

1. In the Vercel project → **Storage** tab → **Create Database**
2. Choose **Upstash Redis** (technically now found under Marketplace →
   search "Redis" if it's not listed directly under Storage — Vercel's own
   KV product was deprecated in favor of this)
3. Once created, Vercel automatically injects two environment variables
   into your project:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. No code changes needed — `src/lib/slider-data.ts` already checks for
   these and uses Redis automatically when they're present.

---

## Step 4 — Deploy

Click **Deploy**. Vercel will run `npm run build` and go live at a
`*.vercel.app` URL. Add your custom domain afterward under
**Settings → Domains**.

---

## After deploying — verify the slider

1. Visit `/admin/homepage-slider`, edit a slide, click **Save Changes**
2. Reload the homepage — the change should appear within a few seconds
   (client-side fetch)
3. If it doesn't change: double check the Redis env vars are present under
   **Settings → Environment Variables** and redeploy

---

## Known limitations at this stage (by design — not bugs)

| Page/Feature | Status |
|---|---|
| Login / Signup | UI only — forms show a message, don't create real accounts |
| Member Dashboard | Shows one sample member, not real session data |
| Admin Panel (Members/Events/Donations/Branches) | Sample data, edits don't persist |
| Donation page | Razorpay not connected — no real payments process |
| Contact form | Doesn't send real emails yet |
| Homepage Slider | ✅ Fully working once Redis is connected (Step 3) |

These will be connected once Supabase (database + auth), NextAuth.js,
Razorpay, and an email provider are set up — that's the next phase of
development.

---

## Local development (optional, before or after deploying)

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. Without Redis env vars set locally, the
slider automatically falls back to a local JSON file (`data/slider.json`)
so you can still develop and test it offline.
