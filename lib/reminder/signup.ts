'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export type ReminderSignupResult =
  | { success: true; alreadySignedUp?: boolean }
  | { success: false; error: string };

const SOURCE_SEASON_REMINDER = 'season_reminder';

/**
 * Add an email to reminder_signups for "Get Reminders for Next Semester".
 * Uses unique (email, source) — duplicate signups for same source return success (already signed up).
 * Run docs/reminder-signups-table.sql in Supabase first.
 */
export async function submitReminderSignup(payload: {
  email: string;
  school?: string | null;
}): Promise<ReminderSignupResult> {
  const email = payload.email?.trim()?.toLowerCase();
  if (!email) {
    return { success: false, error: 'Please enter your email address.' };
  }
  if (email.length > 320) {
    return { success: false, error: 'Email address is too long.' };
  }
  const school = payload.school?.trim() || null;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('reminder_signups').insert({
      email,
      source: SOURCE_SEASON_REMINDER,
      school,
    });

    if (error) {
      if (error.code === '23505') {
        return { success: true, alreadySignedUp: true };
      }
      console.error('[submitReminderSignup]', error);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Something went wrong.';
    console.error('[submitReminderSignup]', err);
    return { success: false, error: msg };
  }
}
