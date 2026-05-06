import { sendContactEmail } from '../lib/ses';
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

export interface HandlerEnv {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  TURNSTILE_SECRET_KEY: string;
}

export async function handleContact(
  input: ContactInput,
  env: HandlerEnv,
): Promise<{ success: true }> {
  if (input.website) {
    return { success: true };
  }

  const ok = await verifyTurnstile(input.turnstileToken, env.TURNSTILE_SECRET_KEY);
  if (!ok) {
    throw new Error('verification_failed');
  }

  await sendContactEmail(
    {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
    },
    env,
  );

  return { success: true };
}
