# GitHub + Vercel Setup (Simple)

Use this for connecting a local project to GitHub and deploying on Vercel. Keep setup minimal.

---

## 1. Create the GitHub repo (one-time)

**Option A – You already have local code**

1. On GitHub: **New repository** → name it, leave it **empty** (no README, no .gitignore).
2. Locally, in your project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_ORG_OR_USER/REPO_NAME.git
   git push -u origin main
   ```
   Replace `YOUR_ORG_OR_USER` and `REPO_NAME` with your GitHub org/username and repo name.

**Option B – You start from a GitHub template or clone**

1. Create repo from template or clone it.
2. `cd` into the folder, add remote if needed, push to `main`.

---

## 2. Connect to Vercel (one-time)

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. **Add New** → **Project**.
3. **Import** the GitHub repo. Authorize GitHub if asked.
4. Leave **Build Command** and **Output Directory** as default (Vercel auto-detects Next.js).
5. Add **Environment Variables** (copy from `.env.local`; do not commit `.env.local`).
6. Click **Deploy**.

After this, every push to `main` triggers a new deployment automatically.

---

## 3. Custom domain (optional)

1. Vercel: **Project** → **Settings** → **Domains**.
2. Add your domain and follow Vercel’s DNS instructions at your registrar.

---

## 4. Daily workflow

```bash
git add .
git commit -m "Description of change"
git push origin main
```

Vercel redeploys on push. No extra “connection” or “sync” steps.

---

## What *not* to overcomplicate

- **Do not** add multiple remotes, custom “connection” scripts, or agent workflows just to “set up GitHub.” One `git remote`, one `main` branch, push as above.
- **Do not** use Vercel CLI for basic deploy – linking the repo in the Vercel dashboard is enough.
- **Secrets:** Never commit `.env` or `.env.local`. Add variables in **Vercel → Project → Settings → Environment Variables**.

---

*Summary: Create empty GitHub repo → `git init`, add, commit, `remote add origin`, push → In Vercel, import repo and add env vars → Deploy. Then `git push origin main` updates the site.*
