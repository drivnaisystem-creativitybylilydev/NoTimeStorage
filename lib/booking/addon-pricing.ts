import type { BookingItemInput, BookingItemType } from './types';

/** Max additional-item units (sum of all non-box lines) in configure / checkout / edit UI */
export const MAX_ADDITIONAL_ITEMS = 99;

/** Canonical monthly add-on rates in cents — single source for DB and UI */
export const ADDON_UNIT_PRICE_CENTS: Record<Exclude<BookingItemType, 'box'>, number> = {
  small_with_box: 600,
  small_without_box: 900,
  medium_with_box: 1000,
  medium_without_box: 1700,
  large: 5500,
};

/** Per-box monthly rate in cents for the whole booking’s box tier (matches configure/payment). */
export function getBoxUnitPriceCents(boxCount: number): number {
  if (boxCount <= 0) return 0;
  if (boxCount === 1) return 8000;
  if (boxCount === 2 || boxCount === 3) return 5500;
  return 6000;
}

export function getBoxPriceDollars(boxCount: number): number {
  return getBoxUnitPriceCents(boxCount) / 100;
}

/** URL / form keys → monthly USD for display (matches ADDON_UNIT_PRICE_CENTS) */
export const ADDON_PRICE_USD_MONTH = {
  smallWithBox: ADDON_UNIT_PRICE_CENTS.small_with_box / 100,
  smallWithoutBox: ADDON_UNIT_PRICE_CENTS.small_without_box / 100,
  mediumWithBox: ADDON_UNIT_PRICE_CENTS.medium_with_box / 100,
  mediumWithoutBox: ADDON_UNIT_PRICE_CENTS.medium_without_box / 100,
  large: ADDON_UNIT_PRICE_CENTS.large / 100,
} as const;

/** Full tier hints for configure, FAQ, edit booking (not exhaustive) */
export const ADDON_TIER_SUMMARY = {
  small:
    'e.g. lamp, fan, small bin, shoe rack, folding chair, small box, basket, vacuum, broom, mirror',
  medium:
    'e.g. ottoman, printer, microwave, duffle bags, plastic bins, TV, mini fridge, desk chair, rug, mattress topper, bedding, medium box, chest',
  large: 'e.g. couch, bikes',
} as const;

/** Shorter lines for homepage pricing cards (mobile-friendly) */
export const ADDON_TIER_HOMEPAGE_TEASER = {
  small: 'Lamp, fan, vacuum, mirror, shoe rack, small bin, basket…',
  medium: 'TV, mini fridge, microwave, rug, printer, bins, bedding…',
  large: 'Couch, bikes',
} as const;

export function countAdditionalItemUnits(items: Pick<BookingItemInput, 'item_type' | 'quantity'>[]): number {
  return items.filter((i) => i.item_type !== 'box').reduce((s, i) => s + i.quantity, 0);
}

/** Enforce with-box / without-box add-on rules relative to storage box count */
export function validateAddonPricingLock(
  boxQuantity: number,
  items: Pick<BookingItemInput, 'item_type' | 'quantity'>[],
): string | null {
  for (const row of items) {
    if (row.quantity <= 0) continue;
    if (boxQuantity >= 1) {
      if (row.item_type === 'small_without_box' || row.item_type === 'medium_without_box') {
        return 'Without-box pricing is not available when you have storage boxes.';
      }
    } else {
      if (row.item_type === 'small_with_box' || row.item_type === 'medium_with_box') {
        return 'With-box add-on pricing requires at least one storage box.';
      }
    }
  }
  const extras = countAdditionalItemUnits(items);
  if (extras > MAX_ADDITIONAL_ITEMS) {
    return `Additional items are limited to ${MAX_ADDITIONAL_ITEMS} per booking.`;
  }
  return null;
}

/**
 * Verify each line uses canonical unit prices and monthly total matches.
 * @returns error message or null if OK
 */
export function validateItemsAndMonthlyTotal(input: {
  items: BookingItemInput[];
  monthly_total_cents: number;
}): string | null {
  if (!input.items?.length) return 'At least one line item is required.';

  const boxLines = input.items.filter((i) => i.item_type === 'box');
  if (boxLines.length > 1) return 'Invalid booking: multiple box lines.';

  const boxLine = boxLines[0];
  if (boxLine && boxLine.quantity <= 0) return 'Invalid box quantity.';

  const boxQuantity = boxLine && boxLine.quantity > 0 ? boxLine.quantity : 0;

  if (boxLines.length === 1 && !boxQuantity) return 'Invalid box quantity.';

  if (boxQuantity >= 1) {
    if (!boxLine || boxLine.unit_price_cents !== getBoxUnitPriceCents(boxQuantity)) {
      return 'Invalid box pricing. Please refresh and try again.';
    }
  } else if (boxLine) {
    return 'Invalid booking: unexpected box line.';
  }

  const hasNonBox = input.items.some((i) => i.item_type !== 'box' && i.quantity > 0);
  if (boxQuantity < 1 && !hasNonBox) {
    return 'Add at least one storage box or one additional item.';
  }

  let expectedMonthlyCents = 0;
  for (const item of input.items) {
    if (item.quantity < 0) return 'Invalid quantity.';
    if (item.item_type === 'box') {
      expectedMonthlyCents += item.unit_price_cents * item.quantity;
    } else {
      if (item.quantity === 0) continue;
      const canonical = ADDON_UNIT_PRICE_CENTS[item.item_type as Exclude<BookingItemType, 'box'>];
      if (canonical === undefined) return 'Unknown item type.';
      if (item.unit_price_cents !== canonical) {
        return 'Invalid add-on pricing. Please refresh and try again.';
      }
      expectedMonthlyCents += canonical * item.quantity;
    }
  }

  const lockErr = validateAddonPricingLock(boxQuantity, input.items);
  if (lockErr) return lockErr;

  if (Math.abs(expectedMonthlyCents - input.monthly_total_cents) > 1) {
    return 'Order total does not match items. Please refresh and try again.';
  }

  return null;
}

/** Validates structure, canonical prices, lock rules, and max add-ons (e.g. booking item updates). */
export function validateBookingLineItems(items: BookingItemInput[]): string | null {
  if (!items?.length) return 'At least one item is required.';

  const boxLines = items.filter((i) => i.item_type === 'box');
  if (boxLines.length > 1) return 'Invalid booking: multiple box lines.';
  const boxLine = boxLines[0];
  if (boxLine && boxLine.quantity <= 0) return 'Invalid box quantity.';
  const boxQuantity = boxLine && boxLine.quantity > 0 ? boxLine.quantity : 0;
  if (boxLines.length === 1 && !boxQuantity) return 'Invalid box quantity.';
  if (boxQuantity >= 1) {
    if (!boxLine || boxLine.unit_price_cents !== getBoxUnitPriceCents(boxQuantity)) {
      return 'Invalid box pricing.';
    }
  } else if (boxLine) {
    return 'Invalid booking: unexpected box line.';
  }

  const hasNonBox = items.some((i) => i.item_type !== 'box' && i.quantity > 0);
  if (boxQuantity < 1 && !hasNonBox) {
    return 'Add at least one storage box or one additional item.';
  }

  for (const item of items) {
    if (item.quantity < 0) return 'Invalid quantity.';
    if (item.item_type === 'box') continue;
    if (item.quantity === 0) continue;
    const canonical = ADDON_UNIT_PRICE_CENTS[item.item_type as Exclude<BookingItemType, 'box'>];
    if (canonical === undefined) return 'Unknown item type.';
    if (item.unit_price_cents !== canonical) return 'Invalid add-on pricing.';
  }

  const lockErr = validateAddonPricingLock(boxQuantity, items);
  if (lockErr) return lockErr;

  return null;
}
