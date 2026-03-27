import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { EditBookingForm } from './EditBookingForm';

type BookingItemRow = { item_type: string; quantity: number };
type AdditionalItems = {
  smallWithBox: number;
  smallWithoutBox: number;
  mediumWithBox: number;
  mediumWithoutBox: number;
  large: number;
};

function parseBookingItemsToForm(items: BookingItemRow[] | null): { boxQuantity: number; additionalItems: AdditionalItems } {
  const additionalItems: AdditionalItems = {
    smallWithBox: 0,
    smallWithoutBox: 0,
    mediumWithBox: 0,
    mediumWithoutBox: 0,
    large: 0,
  };
  let boxQuantity = 0;

  if (!items?.length) return { boxQuantity: 0, additionalItems };

  for (const row of items) {
    const qty = row.quantity ?? 0;
    switch (row.item_type) {
      case 'box': boxQuantity += qty; break;
      case 'small_with_box': additionalItems.smallWithBox += qty; break;
      case 'small_without_box': additionalItems.smallWithoutBox += qty; break;
      case 'medium_with_box': additionalItems.mediumWithBox += qty; break;
      case 'medium_without_box': additionalItems.mediumWithoutBox += qty; break;
      case 'large': additionalItems.large += qty; break;
    }
  }

  return { boxQuantity, additionalItems };
}

export default async function EditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/login?redirect=${encodeURIComponent(`/booking/edit/${bookingId}`)}`);
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();

  const profileId = profile?.id ?? user.id;
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      user_id,
      payment_status,
      total_monthly_rate,
      storage_months,
      move_out_date,
      move_in_date,
      booking_items ( item_type, quantity )
    `)
    .eq('id', bookingId)
    .single();

  if (error || !booking) notFound();
  if (booking.user_id !== profileId) notFound();

  const items = (booking as { booking_items?: BookingItemRow[] }).booking_items ?? [];
  const { boxQuantity, additionalItems } = parseBookingItemsToForm(Array.isArray(items) ? items : []);

  const isPaid = booking.payment_status === 'paid';
  const initialMonthlyTotal = (booking.total_monthly_rate as number) ?? 0;
  const storageMonths = (booking.storage_months as number) ?? 3;

  return (
    <EditBookingForm
      bookingId={bookingId}
      initialBoxQuantity={boxQuantity}
      initialAdditionalItems={additionalItems}
      isPaid={isPaid}
      initialMonthlyTotal={initialMonthlyTotal}
      storageMonths={storageMonths}
    />
  );
}
