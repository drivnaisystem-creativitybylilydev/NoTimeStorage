/**
 * Payment plan calculation utilities for NoTime Storage monthly installments.
 * All amounts are in CENTS unless noted.
 */

export const MONTHLY_PLAN_MONTHS = 3;
export const DEPOSIT_CREDIT_CENTS = 100; // TEST: $1.00 — change back to 5000 after testing
export const MONTHLY_PLAN_MIN_BALANCE_CENTS = 0; // no minimum

export interface MonthlyBreakdown {
  /** Total remaining balance after deposit (cents) */
  remainingBalanceCents: number;
  /** Base monthly amount before deposit credit (cents) */
  baseMonthCents: number;
  /** Month 1: base amount minus $50 deposit credit (cents) — charged today */
  month1Cents: number;
  /** Month 2: base amount (cents) — charged 30 days after booking */
  month2Cents: number;
  /** Month 3: remainder to ensure total is exact (cents) — charged 60 days after booking */
  month3Cents: number;
  /** ISO date string for month 2 auto-charge (booking date + 30 days) */
  month2Date: string;
  /** ISO date string for month 3 auto-charge (booking date + 60 days) */
  month3Date: string;
  /** Total of all three months — must equal remainingBalanceCents */
  totalCents: number;
}

/**
 * Returns true if the booking is eligible for a monthly plan.
 */
export function isEligibleForMonthlyPlan(remainingBalanceCents: number): boolean {
  return remainingBalanceCents >= MONTHLY_PLAN_MIN_BALANCE_CENTS;
}

/**
 * Calculates the 3-month installment breakdown.
 *
 * @param totalPriceCents  Full booking price in cents (before deposit deduction)
 * @param bookingDate      Date the booking is made (default: today)
 */
export function calculateMonthlyBreakdown(
  totalPriceCents: number,
  bookingDate: Date = new Date(),
): MonthlyBreakdown {
  const remainingBalanceCents = totalPriceCents - DEPOSIT_CREDIT_CENTS;

  // Divide TOTAL price into 3 equal monthly bases (rounded to nearest dollar).
  const baseMonthCents = Math.round(totalPriceCents / MONTHLY_PLAN_MONTHS / 100) * 100;

  // Month 1: base minus the $50 deposit credit (charged today)
  const month1Cents = baseMonthCents - DEPOSIT_CREDIT_CENTS;

  // Month 2: standard base
  const month2Cents = baseMonthCents;

  // Month 3: absorbs any rounding so the 3-month total always equals remainingBalance
  const month3Cents = remainingBalanceCents - month1Cents - month2Cents;

  const month2Date = new Date(bookingDate);
  month2Date.setDate(month2Date.getDate() + 30);

  const month3Date = new Date(bookingDate);
  month3Date.setDate(month3Date.getDate() + 60);

  return {
    remainingBalanceCents,
    baseMonthCents,
    month1Cents,
    month2Cents,
    month3Cents,
    month2Date: month2Date.toISOString().split('T')[0],
    month3Date: month3Date.toISOString().split('T')[0],
    totalCents: month1Cents + month2Cents + month3Cents,
  };
}
