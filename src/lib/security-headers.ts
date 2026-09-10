/** Shared security headers for middleware and static `public/_headers`. */

export const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'autoplay=(self)',
  'camera=()',
  'cross-origin-isolated=()',
  'display-capture=()',
  'encrypted-media=(self)',
  'fullscreen=(self)',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'payment=()',
  'picture-in-picture=(self)',
  'publickey-credentials-get=()',
  'screen-wake-lock=()',
  'sync-xhr=()',
  'usb=()',
  'web-share=()',
  'xr-spatial-tracking=()',
].join(', ');

export function buildContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    // Bundled Astro modules + consent-gated third-party loaders only (no unsafe-inline).
    "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com https://static.cloudflareinsights.com https://*.clarity.ms",
    "style-src 'self' 'unsafe-inline' https://fonts.jamestannahill.com",
    "font-src 'self' https://fonts.jamestannahill.com data:",
    "img-src 'self' https: data: blob:",
    "media-src 'self' https://media.jamestannahill.com",
    "frame-src https://challenges.cloudflare.com",
    "connect-src 'self' https://www.google-analytics.com https://*.googletagmanager.com https://stats.g.doubleclick.net https://challenges.cloudflare.com https://*.clarity.ms https://email.us-east-1.amazonaws.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

/**
 * RFC 8288 Link relations advertising the machine-readable surface of the site,
 * per RFC 9727 (`api-catalog`). Served on the homepage so an agent that fetches
 * `/` alone can discover the catalog, the API description, and the entity docs
 * without guessing well-known paths.
 *
 * Emitted as a single comma-separated field value, which RFC 8288 treats as
 * equivalent to repeated `Link` headers.
 */
export const HOMEPAGE_LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</openapi.json>; rel="service-desc"; type="application/json"',
  '</llms.txt>; rel="service-doc"; type="text/plain"',
  '</llms-full.txt>; rel="describedby"; type="text/plain"',
].join(', ');

export const SECURITY_HEADER_ENTRIES: ReadonlyArray<[string, string]> = [
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload'],
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'SAMEORIGIN'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Cross-Origin-Opener-Policy', 'same-origin'],
  ['Permissions-Policy', PERMISSIONS_POLICY],
  ['Content-Security-Policy', buildContentSecurityPolicy()],
];

/** EEA + UK ISO 3166-1 alpha-2 codes (Cloudflare CF-IPCountry). */
export const EU_CONSENT_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO',
  'GB', 'UK', 'CH',
]);

export function requiresAnalyticsConsent(country: string | null | undefined): boolean {
  if (!country) return true;
  return EU_CONSENT_COUNTRIES.has(country.toUpperCase());
}
