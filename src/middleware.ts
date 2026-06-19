import { defineMiddleware } from 'astro:middleware';
import { requiresAnalyticsConsent, SECURITY_HEADER_ENTRIES } from './lib/security-headers';

export const onRequest = defineMiddleware(async (context, next) => {
  const country = context.request.headers.get('CF-IPCountry');
  context.locals.country = country ?? undefined;
  context.locals.requiresConsent = requiresAnalyticsConsent(country);

  const response = await next();

  for (const [name, value] of SECURITY_HEADER_ENTRIES) {
    response.headers.set(name, value);
  }

  return response;
});
