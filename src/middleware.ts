import { defineMiddleware } from 'astro:middleware';
import {
  HOMEPAGE_LINK_HEADER,
  requiresAnalyticsConsent,
  SECURITY_HEADER_ENTRIES,
} from './lib/security-headers';

export const onRequest = defineMiddleware(async (context, next) => {
  const country = context.request.headers.get('CF-IPCountry');
  context.locals.country = country ?? undefined;
  context.locals.requiresConsent = requiresAnalyticsConsent(country);

  const response = await next();

  for (const [name, value] of SECURITY_HEADER_ENTRIES) {
    response.headers.set(name, value);
  }

  // Agent discovery (RFC 8288 / RFC 9727). Static `/` is served by Workers
  // Assets with `public/_headers`; this covers the SSR path so both agree.
  if (context.url.pathname === '/') {
    response.headers.set('Link', HOMEPAGE_LINK_HEADER);
  }

  return response;
});
