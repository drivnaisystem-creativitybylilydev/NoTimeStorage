'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export type SubmitContactResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Insert a contact form submission into public.contact_submissions.
 * No auth required — anyone can submit. Run docs/contact-submissions-table.sql in Supabase first.
 */
export async function submitContactForm(payload: {
  name: string;
  email: string;
  subject: string;
  subject_other?: string | null;
  message: string;
}): Promise<SubmitContactResult> {
  const { name, email, subject, subject_other, message } = payload;

  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim();
  const trimmedSubject = subject?.trim();
  const trimmedMessage = message?.trim();

  if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
    return { success: false, error: 'Please fill in all required fields.' };
  }

  if (trimmedName.length > 500) {
    return { success: false, error: 'Name is too long.' };
  }
  if (trimmedMessage.length > 10000) {
    return { success: false, error: 'Message is too long.' };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('contact_submissions').insert({
      name: trimmedName,
      email: trimmedEmail,
      subject: trimmedSubject,
      subject_other: subject_other?.trim() || null,
      message: trimmedMessage,
    });

    if (error) {
      console.error('[submitContactForm]', error);
      return { success: false, error: 'Failed to send. Please try again or email us directly.' };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Something went wrong.';
    console.error('[submitContactForm]', err);
    return { success: false, error: msg };
  }
}
