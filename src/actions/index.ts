import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { handleContact } from './contact-handler';

export const server = {
  sendContact: defineAction({
    accept: 'form',
    input: z.object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().optional().default(''),
      email: z.string().email('Valid email required'),
      phone: z.string().optional().default(''),
      subject: z.string().optional().default('(no subject)'),
      message: z.string().min(1, 'Message is required'),
      website: z.string().optional().default(''),
      'cf-turnstile-response': z.string().min(1, 'Verification required'),
    }),
    handler: async (input, context) => {
      const env = context.locals.runtime.env;
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
