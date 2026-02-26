/**
 * Booking backend types — shared between server action and integrations.
 */

export type BookingStatus = 'draft' | 'pending' | 'pending_payment' | 'confirmed' | 'cancelled';

export type BookingItemType =
  | 'box'
  | 'small_with_box'
  | 'small_without_box'
  | 'medium_with_box'
  | 'medium_without_box'
  | 'large';

export interface BookingItemInput {
  item_type: BookingItemType;
  quantity: number;
  unit_price_cents: number;
}

export interface CreateBookingInput {
  user_id: string;
  move_out_date: string; // YYYY-MM-DD
  move_in_date: string;
  move_out_time_slot: string; // e.g. "14:00"
  dorm: string;
  elevator_available: boolean;
  stairs_required: boolean;
  special_instructions?: string;
  school: string;
  monthly_total_cents: number;
  items: BookingItemInput[];
}

export interface Booking {
  id: string;
  user_id: string;
  status: BookingStatus;
  move_out_date: string;
  move_in_date: string;
  move_out_time_slot: string;
  dorm: string;
  elevator_available: boolean;
  stairs_required: boolean;
  special_instructions: string | null;
  school: string;
  monthly_total_cents: number;
  created_at: string;
  updated_at: string;
}

export interface BookingWithItems extends Booking {
  items?: { item_type: string; quantity: number; unit_price_cents: number }[];
}
