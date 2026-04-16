/**
 * Jump to any state in the Venmo flow without clicking through the whole app.
 *
 * Usage:
 *   node scripts/test-venmo-state.mjs fresh           # new user, deposit unpaid
 *   node scripts/test-venmo-state.mjs deposit-paid    # deposit flipped, ready to book
 *   node scripts/test-venmo-state.mjs unpaid-booking  # booking saved, venmo pending
 *   node scripts/test-venmo-state.mjs paid-booking    # fully confirmed
 *   node scripts/test-venmo-state.mjs reset <email>   # nuke a test user + their bookings
 *
 * After it prints the auth link, open it in a private window — you'll be
 * signed in as the seeded user and dropped at the right spot.
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

function loadEnvLocal() {
  const p = join(process.cwd(), '.env.local');
  if (!existsSync(p)) {
    console.error('Missing .env.local');
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

const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const state = (process.argv[2] || '').trim();

async function createAuthUser({ email, fullName, phone }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password: 'TestPass123!',
    user_metadata: { full_name: fullName, phone, school: 'Stonehill College' },
  });
  if (error) throw error;
  return data.user;
}

async function upsertProfile({ authUserId, email, fullName, phone, depositPaid }) {
  const row = {
    id: authUserId,
    full_name: fullName,
    email,
    phone,
    school: 'Stonehill College',
    deposit_paid: depositPaid,
  };
  const { error } = await supabase.from('users').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

async function magicLink(email) {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${siteUrl}/auth/callback` },
  });
  if (error) throw error;
  return data.properties?.action_link;
}

async function seedBooking({ userId, paid }) {
  const bookingId = randomUUID();
  const monthly = 80;
  const months = 3;
  const totalPrice = monthly * months;
  const now = new Date().toISOString();
  const bookingRow = {
    id: bookingId,
    user_id: userId,
    school: 'Stonehill College',
    status: paid ? 'confirmed' : 'pending',
    payment_status: paid ? 'paid' : 'unpaid',
    payment_plan: 'full',
    box_quantity: 1,
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
    special_instructions: `Test seed · ${state}`,
    paid_at: paid ? now : null,
  };
  const { error: bErr } = await supabase.from('bookings').insert(bookingRow);
  if (bErr) throw bErr;

  const { error: iErr } = await supabase.from('booking_items').insert([
    { booking_id: bookingId, item_category: 'box', item_type: 'box', quantity: 1, monthly_rate: 80, subtotal: 80 },
  ]);
  if (iErr) throw iErr;

  // Deposit row (simulates the $50 commitment)
  const { error: pErr } = await supabase.from('payments').insert({
    booking_id: bookingId,
    amount: 50,
    payment_type: 'deposit',
    status: 'succeeded',
  });
  if (pErr) console.warn('[payments deposit]', pErr.message);

  if (paid) {
    const { error: p2Err } = await supabase.from('payments').insert({
      booking_id: bookingId,
      amount: totalPrice,
      payment_type: 'full_payment',
      status: 'succeeded',
    });
    if (p2Err) console.warn('[payments full]', p2Err.message);
  }

  return { bookingId, totalPrice, monthly, months };
}

async function resetUserByEmail(email) {
  const { data: users } = await supabase.auth.admin.listUsers();
  const match = users?.users?.find((u) => u.email === email);
  if (!match) {
    console.log('No auth user with that email — nothing to clean.');
    return;
  }
  const { data: profile } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
  const profileId = profile?.id;
  if (profileId) {
    const { data: bookings } = await supabase.from('bookings').select('id').eq('user_id', profileId);
    const ids = (bookings ?? []).map((b) => b.id);
    if (ids.length) {
      await supabase.from('payments').delete().in('booking_id', ids);
      await supabase.from('schedules').delete().in('booking_id', ids);
      await supabase.from('booking_items').delete().in('booking_id', ids);
      await supabase.from('bookings').delete().in('id', ids);
    }
    await supabase.from('users').delete().eq('id', profileId);
  }
  await supabase.auth.admin.deleteUser(match.id);
  console.log(`Deleted ${email} (auth + profile + bookings).`);
}

async function main() {
  if (state === 'reset') {
    const target = process.argv[3];
    if (!target) {
      console.error('Pass an email: node scripts/test-venmo-state.mjs reset <email>');
      process.exit(1);
    }
    await resetUserByEmail(target);
    return;
  }

  if (!['fresh', 'deposit-paid', 'unpaid-booking', 'paid-booking'].includes(state)) {
    console.error('Unknown state. Use: fresh | deposit-paid | unpaid-booking | paid-booking | reset <email>');
    process.exit(1);
  }

  const stamp = Date.now();
  const email = `venmo-test+${state}-${stamp}@notimestorage.local`;
  const fullName = `Venmo Test ${state}`;
  const phone = '+15555550150';

  const authUser = await createAuthUser({ email, fullName, phone });
  const depositPaid = state !== 'fresh';
  await upsertProfile({ authUserId: authUser.id, email, fullName, phone, depositPaid });

  let bookingInfo = null;
  if (state === 'unpaid-booking') {
    bookingInfo = await seedBooking({ userId: authUser.id, paid: false });
  } else if (state === 'paid-booking') {
    bookingInfo = await seedBooking({ userId: authUser.id, paid: true });
  }

  const link = await magicLink(email);

  console.log(`\n✓ Seeded state: ${state}`);
  console.log(`  email:      ${email}`);
  console.log(`  password:   TestPass123!`);
  console.log(`  auth id:    ${authUser.id}`);
  if (bookingInfo) {
    console.log(`  booking id: ${bookingInfo.bookingId}`);
    console.log(`  balance:    $${(bookingInfo.totalPrice - 50).toFixed(2)} (after $50 deposit)`);
  }
  console.log('\nWhere to go:');
  if (state === 'fresh') {
    console.log(`  User:  open ${link}`);
    console.log(`  Then:  lands on /deposit, sees Venmo card`);
    console.log(`  Admin: ${siteUrl}/admin/customers — hit "Mark paid"`);
  } else if (state === 'deposit-paid') {
    console.log(`  User:  open ${link}`);
    console.log(`  Then:  lands on /dashboard, can go /booking/configure`);
  } else if (state === 'unpaid-booking') {
    console.log(`  User:  open ${link}`);
    console.log(`  Admin: ${siteUrl}/admin/bookings — find booking, hit "Mark paid"`);
    console.log(`         (this should trigger the "booking confirmed" email)`);
  } else if (state === 'paid-booking') {
    console.log(`  User:  open ${link}`);
    console.log(`         Go to /dashboard → Edit booking → add items to test upgrade Venmo flow`);
  }
  console.log(`\nCleanup: node scripts/test-venmo-state.mjs reset ${email}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
