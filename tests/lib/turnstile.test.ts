import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyTurnstile, parseHostnames } from '../../src/lib/turnstile';

const EXPECT = { action: 'contact', hostnames: 'jamestannahill.com', remoteip: '203.0.113.7' };
const ok = (over: Record<string, unknown> = {}) =>
  new Response(
    JSON.stringify({ success: true, action: 'contact', hostname: 'jamestannahill.com', ...over }),
    { status: 200 },
  );

describe('verifyTurnstile', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts a successful token for the expected action and hostname', async () => {
    fetchMock.mockResolvedValue(ok());
    expect(await verifyTurnstile('tok', 'secret', EXPECT)).toBe(true);
  });

  it('rejects when siteverify reports failure', async () => {
    fetchMock.mockResolvedValue(ok({ success: false }));
    expect(await verifyTurnstile('tok', 'secret', EXPECT)).toBe(false);
  });

  it('rejects a token issued for a different action', async () => {
    fetchMock.mockResolvedValue(ok({ action: 'signup' }));
    expect(await verifyTurnstile('tok', 'secret', EXPECT)).toBe(false);
  });

  it('rejects a token issued on an unapproved hostname', async () => {
    fetchMock.mockResolvedValue(ok({ hostname: 'localhost' }));
    expect(await verifyTurnstile('tok', 'secret', EXPECT)).toBe(false);
  });

  it('rejects when siteverify returns non-2xx or throws', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 500 }));
    expect(await verifyTurnstile('tok', 'secret', EXPECT)).toBe(false);
    fetchMock.mockRejectedValue(new Error('network'));
    expect(await verifyTurnstile('tok', 'secret', EXPECT)).toBe(false);
  });

  it('fails closed without calling siteverify on bad input', async () => {
    expect(await verifyTurnstile('', 'secret', EXPECT)).toBe(false);
    expect(await verifyTurnstile('x'.repeat(2049), 'secret', EXPECT)).toBe(false);
    expect(await verifyTurnstile('tok', '', EXPECT)).toBe(false);
    expect(await verifyTurnstile('tok', 'secret', { ...EXPECT, hostnames: ' , ' })).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('POSTs token, secret and remoteip to the siteverify endpoint', async () => {
    fetchMock.mockResolvedValue(ok());
    await verifyTurnstile('TOKEN', 'SECRET', EXPECT);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(init.method).toBe('POST');
    const body = init.body.toString();
    expect(body).toContain('secret=SECRET');
    expect(body).toContain('response=TOKEN');
    expect(body).toContain('remoteip=203.0.113.7');
  });
});

describe('parseHostnames', () => {
  it('splits, trims and drops empties', () => {
    expect([...parseHostnames(' jamestannahill.com , ,www.jamestannahill.com')]).toEqual([
      'jamestannahill.com',
      'www.jamestannahill.com',
    ]);
    expect(parseHostnames(undefined).size).toBe(0);
  });
});
