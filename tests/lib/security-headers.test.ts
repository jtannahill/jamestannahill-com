import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EU_CONSENT_COUNTRIES,
  buildContentSecurityPolicy,
  requiresAnalyticsConsent,
} from '../../src/lib/security-headers';

describe('security-headers', () => {
  it('requires consent for EU countries', () => {
    expect(requiresAnalyticsConsent('DE')).toBe(true);
    expect(requiresAnalyticsConsent('GB')).toBe(true);
    expect(requiresAnalyticsConsent('US')).toBe(false);
  });

  it('requires consent when country is unknown', () => {
    expect(requiresAnalyticsConsent(undefined)).toBe(true);
    expect(requiresAnalyticsConsent(null)).toBe(true);
    expect(requiresAnalyticsConsent('XX')).toBe(true);
  });

  it('keeps public/_headers CSP identical to the middleware CSP', () => {
    // Prerendered pages bypass middleware, so _headers alone governs them.
    const headers = readFileSync('public/_headers', 'utf8');
    const line = headers.split('\n').find((l) => l.trim().startsWith('Content-Security-Policy:'));
    expect(line?.trim().replace('Content-Security-Policy: ', '')).toBe(buildContentSecurityPolicy());
  });

  it('no longer allows the retired SES endpoint', () => {
    expect(buildContentSecurityPolicy()).not.toContain('amazonaws.com');
  });

  it('does not allow script unsafe-inline', () => {
    const csp = buildContentSecurityPolicy();
    const scriptSrc = csp.split(';').find((part) => part.trim().startsWith('script-src')) ?? '';
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).toContain("script-src 'self'");
  });

  it('includes core EU markets', () => {
    expect(EU_CONSENT_COUNTRIES.has('FR')).toBe(true);
    expect(EU_CONSENT_COUNTRIES.has('CH')).toBe(true);
  });
});
