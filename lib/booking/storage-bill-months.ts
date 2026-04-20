/**
 * Single source of truth for "how many months" we bill between move-out and move-in.
 * Uses calendar month delta (same as legacy server), minimum 3 months, and the
 * Aug 4 move-in cutoff: move-in strictly after Aug 4 (local calendar) → at least 4 months.
 *
 * Dates are interpreted as calendar Y-M-D in America/New_York business sense:
 * we parse the date part only (no `Date` UTC midnight drift from `YYYY-MM-DD`).
 */

const MIN_BILL_MONTHS = 3;
const AUGUST = 8;
const MOVE_IN_CUTOFF_DAY = 4;

function parseYmdParts(iso: string): { y: number; m: number; d: number } {
  const datePart = iso.trim().split('T')[0].split(' ')[0];
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid date (expected YYYY-MM-DD): ${iso}`);
  }
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

/** Move-in is strictly after August 4 of that calendar year (athlete / late summer rule). */
function isMoveInAfterAugustFourth(moveIn: { y: number; m: number; d: number }): boolean {
  if (moveIn.m > AUGUST) return true;
  if (moveIn.m === AUGUST && moveIn.d > MOVE_IN_CUTOFF_DAY) return true;
  return false;
}

/**
 * Billable storage months for pricing (deposit flow, booking create, upgrades, admin edits).
 */
export function computeStorageBillMonths(moveOutIso: string, moveInIso: string): number {
  const out = parseYmdParts(moveOutIso);
  const inn = parseYmdParts(moveInIso);

  const base =
    (inn.y - out.y) * 12 + (inn.m - out.m);

  let months = Math.max(1, base);
  months = Math.max(MIN_BILL_MONTHS, months);

  if (isMoveInAfterAugustFourth(inn)) {
    months = Math.max(4, months);
  }

  return months;
}
