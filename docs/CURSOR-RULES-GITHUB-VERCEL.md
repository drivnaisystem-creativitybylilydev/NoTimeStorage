# Cursor rules for GitHub + Vercel (use in other projects)

So the Cursor agent always has this in its “knowledge base” and follows the simple approach, do **both** of the following in the **other project**.

---

## Step 1: Add the setup doc to the other project

1. In the **other project**, create a `docs` folder if it doesn’t exist.
2. Copy **this repo’s** `docs/GITHUB-VERCEL-SETUP.md` into that project as:
   - `docs/GITHUB-VERCEL-SETUP.md`
   or
   - `README-GITHUB-AND-VERCEL.md` (at repo root).

The agent can then find it when you ask about “GitHub,” “Vercel,” or “deploy.”

---

## Step 2: Add a Cursor project rule

Create or edit **`.cursorrules`** in the **root of the other project** and add:

```
When the user asks to set up GitHub, connect to GitHub, set up Vercel, or deploy:
1. Follow the steps in docs/GITHUB-VERCEL-SETUP.md (or README-GITHUB-AND-VERCEL.md if you put it at root). Do not invent extra steps.
2. Use a single remote (origin), one main branch, and standard git commands: init, add, commit, remote add origin <url>, push -u origin main.
3. Do not add multiple remotes, custom connection scripts, or unnecessary automation. Do not use Vercel CLI for initial setup unless the user explicitly asks for it.
4. For Vercel: user should import the repo in the Vercel dashboard and add environment variables there; no need for complex tooling.
```

If that project already has a `.cursorrules` file, **append** this block (or merge the bullet list into the existing rules).

---

## Why both?

- **The doc** gives the agent (and you) a single reference for the exact steps.
- **The rule** tells the agent to use that doc and avoid overcomplicating (multiple remotes, scripts, etc.).

With both in the other project, the agent will have the process in its knowledge base and be directed to follow it when you ask about GitHub or Vercel.
