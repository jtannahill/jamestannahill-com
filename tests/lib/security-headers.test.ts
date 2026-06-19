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
