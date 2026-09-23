import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { env } from 'cloudflare:workers';
import { handleContact } from './contact-handler';

// Short fields are echoed into mail (the subject into a header), so they are
// capped and kept to one line; line breaks there could smuggle extra headers.
const singleLine = (max: number) =>
  z.string().max(max).regex(/^[^\r\n]*$/, 'Must be a single line');

export const server = {
  sendContact: defineAction({
    accept: 'form',
    input: z.object({
      firstName: singleLine(100).min(1, 'First name is required'),
      lastName: z.preprocess((v) => v ?? '', singleLine(100)),
      email: z.string().max(254).email('Valid email required'),
      phone: z.preprocess((v) => v ?? '', singleLine(40)),
      subject: z.preprocess((v) => v ?? '(no subject)', singleLine(200)),
      message: z.string().min(1, 'Message is required').max(5000),
      website: z.preprocess((v) => v ?? '', z.string()),
      'cf-turnstile-response': z.string().min(1, 'Verification required'),
    }),
    handler: async (input) => {
      try {
        return await handleContact(
          {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            subject: input.subject,
            message: input.message,
            website: input.website,
            turnstileToken: input['cf-turnstile-response'],
          },
          env,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown';
        if (msg === 'verification_failed') {
          throw new ActionError({ code: 'BAD_REQUEST', message: 'verification_failed' });
        }
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'send_failed' });
      }
    },
  }),
};
