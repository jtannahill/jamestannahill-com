const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileExpectations {
  /** The data-action the widget was rendered with. */
  action: string;
  /**
   * Frontend hostnames this deployment accepts tokens from. Comes from the
   * TURNSTILE_HOSTNAMES var; production must never list localhost.
   */
  hostnames: string;
  /** Visitor IP (cf-connecting-ip), passed through to siteverify. */
  remoteip?: string | null;
}

export function parseHostnames(list: string | undefined): Set<string> {
  return new Set(
    (list ?? '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean),
  );
}

/**
 * Canonical server-side Turnstile check. Fails closed on anything other than
 * a successful token for the expected action, issued on an approved hostname.
 */
export async function verifyTurnstile(
  token: string,
  secret: string,
  expect: TurnstileExpectations,
): Promise<boolean> {
  const hostnames = parseHostnames(expect.hostnames);
  if (
    typeof token !== 'string' ||
    token.length === 0 ||
    token.length > 2048 ||
    !secret ||
    hostnames.size === 0
  ) {
    return false;
  }

  const body = new URLSearchParams({ secret, response: token });
  if (expect.remoteip) body.set('remoteip', expect.remoteip);

  try {
    const res = await fetch(SITEVERIFY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      success?: boolean;
      action?: string;
      hostname?: string;
    };
    return (
      data.success === true &&
      data.action === expect.action &&
      typeof data.hostname === 'string' &&
      hostnames.has(data.hostname)
    );
  } catch {
    return false;
  }
}
