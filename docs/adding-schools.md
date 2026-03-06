# Adding new schools and dorms

New schools (Dayton, UMass, Brevard, Gordon, CCSU) are already in the config with empty dorm lists. Once you have the dorm names, add them in one place; logos go in the brand folder.

---

## 1. Single source of truth: `lib/schools/config.ts`

All school and residence-hall data lives here. Booking schedule, signup, admin bookings, calendar, and homepage all read from this file.

- **To add dorms:** Find the school in the `SCHOOLS` array and replace the empty `dorms: []` with your list, e.g.  
  `dorms: [ 'Hall A', 'Hall B', 'Off-Campus Housing' ]`
- **To add a brand‑new school:** Add an object with `name`, `shortName`, `dorms`, and optionally `location` and `logoSlug` (see existing entries).  
- **Logo filenames:** The site expects logos at `public/brand/school-logos/{logoSlug}.png`. Current `logoSlug`s for the new schools: `Dayton`, `Umass`, `Brevard`, `Gordon`, `CCSU`. Use the same spelling/casing so the homepage and any school pickers show the correct image.

---

## 2. Logo images

Put each school’s logo in:

```text
public/brand/school-logos/{logoSlug}.png
```

Use the same `logoSlug` as in `lib/schools/config.ts` (e.g. `Dayton.png`, `Umass.png`, `Brevard.png`, `Gordon.png`, `CCSU.png`). Existing logos: `Stonehill.png`, `UNH.png`. Same folder, same format.

---

## 3. Process summary

| Step | What to do |
|------|------------|
| 1 | Paste the dorm list for a school into `lib/schools/config.ts` (update that school’s `dorms` array). |
| 2 | Add the school logo to `public/brand/school-logos/` with the matching `logoSlug` filename. |
| 3 | Save; no other code changes needed. Booking flow, admin filters, and homepage will use the new data. |

Schools that still have empty `dorms: []` show “Residence halls for [School] are being added…” on the booking schedule page until you add the list.
