# Cursor / project handoff (read this in new chats)

## Where to work

- **Use this repo at:** `~/Developer/notimestoragewebsite` (local path on Finn’s Mac).
- **Do not** use `~/Desktop/notimestoragewebsite` for Git: Desktop + iCloud caused `git push` failures (`mmap` / `pack-objects`). The Developer copy has a healthy `.git` cloned from GitHub.

## Day-to-day flow

1. Open **`~/Developer/notimestoragewebsite`** in Cursor (File → Open Folder).
2. `npm run dev` → test at **http://localhost:3000**
3. When ready: `git add -A` → `git commit -m "…"` → `git push origin main`
4. **Vercel** deploys from **`main`** when connected to this GitHub repo.

## If `git push` breaks again

- Confirm you are in **`~/Developer/notimestoragewebsite`** (`pwd` in Terminal).
- Fallback to ship without Git: `npm run deploy` (Vercel CLI; project must be linked).

## CI / lint (GitHub Actions)

- Workflow runs `tsc`, `eslint`, `build`.
- `eslint.config.mjs`: `react-hooks/set-state-in-effect` off; `@typescript-eslint/no-explicit-any` is **warn**; `scripts/generate-favicon.js` ignored.
- Reference commit on `main`: **`ffc934d`** — CI lint fixes, admin typing (`lib/admin/actions.ts`), homepage portal/email tweaks, `npm run deploy` in `package.json`.

## New Cursor chat

- Opening the **Developer** folder may start a **new** chat. Say: *Read `docs/cursor-handoff.md` first*, then ask your question.

## Secrets

- Do not put API keys, tokens, or passwords in this file. Production env vars live in **Vercel** / **Supabase** as usual.
