/** All bookable slots: 8:00 AM - 4:40 PM in 20-minute steps. Safe to use on client or server. */
export function getDefaultTimeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];
  for (let hour = 8; hour < 17; hour++) {
    for (let min = 0; min < 60; min += 20) {
      const value = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const label = new Date(`2000-01-01T${value}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      slots.push({ value, label });
    }
  }
  return slots;
}
