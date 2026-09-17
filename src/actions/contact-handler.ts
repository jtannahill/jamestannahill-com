import {
  sendContactConfirmation,
  sendContactEmail,
  type EmailEnv,
} from '../lib/email';
import { verifyTurnstile } from '../lib/turnstile';

export interface ContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  website: string;
  turnstileToken: string;
}

export interface HandlerEnv extends EmailEnv {
  TURNSTILE_SECRET_KEY: string;
}

export interface ContactResult {
  success: true;
  /**
   * True only when the message was actually accepted and sent. The honeypot
   * path returns success so bots see a normal submission, but reports
   * delivered: false so the client can skip the form_submit analytics event.
   */
  delivered: boolean;
}

export async function handleContact(
  input: ContactInput,
  env: HandlerEnv,
): Promise<ContactResult> {
  if (input.website) {
    return { success: true, delivered: false };
  }

  const ok = await verifyTurnstile(input.turnstileToken, env.TURNSTILE_SECRET_KEY);
  if (!ok) {
    throw new Error('verification_failed');
  }

  const payload = {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    subject: input.subject,
    message: input.message,
  };

  await sendContactEmail(payload, env);

  try {
    await sendContactConfirmation(payload, env);
  } catch {
    // Inbound notice already delivered; don't fail the form on a receipt bounce.
  }

  return { success: true, delivered: true };
}
