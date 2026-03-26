/**
 * Human-readable labels for booking line items (admin + customer UIs).
 */
const ITEM_TYPE_LABELS: Record<string, string> = {
  box: 'Storage box',
  small_with_box: 'Small add-on (with box)',
  small_without_box: 'Small add-on (no box)',
  medium_with_box: 'Medium add-on (with box)',
  medium_without_box: 'Medium add-on (no box)',
  large: 'Large add-on',
};

export function formatBookingItemTypeLabel(itemType: string): string {
  return ITEM_TYPE_LABELS[itemType] ?? itemType.replace(/_/g, ' ');
}

/** One-line summary for admin tables (comma-separated, truncated). */
export function summarizeBookingItemsLine(
  items: { item_type: string; quantity: number }[] | undefined | null,
  maxLen = 88,
): string {
  if (!items?.length) return '—';
  const parts = items.map((i) => `${i.quantity}× ${formatBookingItemTypeLabel(i.item_type)}`);
  const s = parts.join(', ');
  if (s.length <= maxLen) return s;
  return `${s.slice(0, Math.max(0, maxLen - 1))}…`;
}
