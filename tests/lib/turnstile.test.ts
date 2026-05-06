import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyTurnstile } from '../../src/lib/turnstile';

describe('verifyTurnstile', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when siteverify reports success', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    expect(await verifyTurnstile('tok', 'secret')).toBe(true);
  });

  it('returns false when siteverify reports failure', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 200 }));
    expect(await verifyTurnstile('tok', 'secret')).toBe(false);
  });

  it('returns false when siteverify returns non-2xx', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 500 }));
    expect(await verifyTurnstile('tok', 'secret')).toBe(false);
  });

  it('POSTs the token and secret to the siteverify endpoint', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    await verifyTurnstile('TOKEN', 'SECRET');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(init.method).toBe('POST');
    const body = init.body.toString();
    expect(body).toContain('secret=SECRET');
    expect(body).toContain('response=TOKEN');
  });
});
