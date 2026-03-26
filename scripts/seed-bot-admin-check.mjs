/**
 * One-off “bot” customer + booking for local/staging admin UI checks.
 * Requires .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: node scripts/seed-bot-admin-check.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

function loadEnvLocal() {
  const p = join(process.cwd(), '.env.local');
  if (!existsSync(p)) {
    console.error('Missing .env.local (need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
  }
  const out = {};
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const userId = randomUUID();
const bookingId = randomUUID();
const email = `admin-check-bot+${Date.now()}@notimestorage.local`;
const fullName = 'Admin Check Bot';

// 2 boxes @ $55 + 1 large @ $15 → $125/mo × 3 months = $375
const monthly = 125;
const months = 3;
const totalPrice = monthly * months;

const userRow = {
  id: userId,
  full_name: fullName,
  email,
  phone: '+15555550199',
  school: 'Stonehill College',
  deposit_paid: true,
};

const bookingRow = {
  id: bookingId,
  user_id: userId,
  school: 'Stonehill College',
  status: 'confirmed',
  payment_status: 'paid',
  payment_plan: 'full',
  box_quantity: 2,
  storage_months: months,
  total_monthly_rate: monthly,
  total_price: totalPrice,
  move_out_date: '2026-06-15',
  move_in_date: '2026-09-15',
  move_out_time_slot: '10:00',
  move_in_time_slot: '10:00',
  dorm: 'Boland Hall',
  room: '301',
  elevator_available: true,
  stairs_required: false,
  special_instructions: 'Seed order: verify itemized list in admin.',
};

const items = [
  {
    id: randomUUID(),
    booking_id: bookingId,
    item_category: 'box',
    item_type: 'box',
    quantity: 2,
    monthly_rate: 55,
    subtotal: 110,
  },
  {
    id: randomUUID(),
    booking_id: bookingId,
    item_category: 'item',
    item_type: 'large',
    quantity: 1,
    monthly_rate: 15,
    subtotal: 15,
  },
];

const { error: uErr } = await supabase.from('users').insert(userRow);
if (uErr) {
  console.error('[users]', uErr);
  process.exit(1);
}

const { error: bErr } = await supabase.from('bookings').insert(bookingRow);
if (bErr) {
  console.error('[bookings]', bErr);
  await supabase.from('users').delete().eq('id', userId);
  process.exit(1);
}

const { error: iErr } = await supabase.from('booking_items').insert(items);
if (iErr) {
  console.error('[booking_items]', iErr);
  await supabase.from('bookings').delete().eq('id', bookingId);
  await supabase.from('users').delete().eq('id', userId);
  process.exit(1);
}

console.log('Seeded bot user + booking for admin check.\n');
console.log('User:', fullName, `(${email})`, 'id=', userId);
console.log('Booking id:', bookingId);
console.log('Line items: 2× box, 1× large (see /admin/bookings → View)\n');
console.log('In the browser: /admin/bookings — search "Admin Check" or', email);
