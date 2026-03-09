# NoTime Storage — Pre-Launch To-Do List

Last updated: March 2026

---

## 🔴 High Priority — Fix Before Launch

### 1. Remove `@supabase/auth-helpers-nextjs` (deprecated)
- Package is no longer supported by Supabase
- Already migrated to `@supabase/ssr` — this package is a ghost dependency
- **Action:** Confirm nothing imports it, then remove from `package.json`
  ```bash
  npm uninstall @supabase/auth-helpers-nextjs
  ```

### 2. Update `uuid` to v7+
- `uuid@3.4.0` uses `Math.random()` which is cryptographically weak
- Could be a security risk if used for booking IDs, tokens, or any sensitive identifiers
- **Action:** Check if it's a direct or transitive dependency
  ```bash
  npm ls uuid
  ```
  If direct: `npm install uuid@latest`

---

## 🟡 Medium Priority — Fix Soon After Launch

### 3. Switch to production Square keys in Vercel
- Set `SQUARE_ENV=production` in Vercel → Production environment only
- Add production `SQUARE_ACCESS_TOKEN`, `SQUARE_APPLICATION_ID`, `SQUARE_LOCATION_ID`
- Redeploy after updating env vars

### 4. Verify Apple Pay domain in Square
- File is served at `https://notimestorage.co/.well-known/apple-developer-merchantid-domain-association`
- Go to Square Developer Dashboard → Apple Pay → Web → Verify `notimestorage.co`
- Test Apple Pay on iPhone in Safari after verification

### 5. Confirm Supabase production URL config
- Authentication → URL Configuration → Site URL = `https://notimestorage.co`
- Redirect URLs includes `https://notimestorage.co/**`

---

## 🟢 Low Priority — Nice to Have

### 6. Clean up transitive deprecated packages
- `glob@11.1.0` — security fix available, update via dependent packages
- `request@2.88.2` + `har-validator@5.1.5` — deprecated HTTP libraries, transitive only
- `mkdirp@0.5.1` — legacy build tool, no runtime impact
- `phin@3.7.1` — unsupported, transitive only

---

## ✅ Already Done

- [x] 0-box bookings — boxes optional, 1–4 items only flow
- [x] Payment page subtotal shows original price crossed out + deposit deducted
- [x] Stonehill dorms updated (12 correct dorms)
- [x] "How to Pack Your Box" section added to student dashboard
- [x] Apple Pay + Google Pay code implemented on deposit + payment pages
- [x] Supabase middleware excludes `.well-known` paths
- [x] Apple Pay verification file served via Next.js route handler
- [x] Square environment switching via `SQUARE_ENV` flag (sandbox/production)
