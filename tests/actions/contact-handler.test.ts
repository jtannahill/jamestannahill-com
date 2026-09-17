import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleContact, type ContactInput, type HandlerEnv } from '../../src/actions/contact-handler';

vi.mock('../../src/lib/email', () => ({
  sendContactEmail: vi.fn(),
  sendContactConfirmation: vi.fn(),
}));
vi.mock('../../src/lib/turnstile', () => ({
  verifyTurnstile: vi.fn(),
}));

import { sendContactEmail, sendContactConfirmation } from '../../src/lib/email';
import { verifyTurnstile } from '../../src/lib/turnstile';

const env: HandlerEnv = {
  EMAIL: { send: vi.fn() },
  TURNSTILE_SECRET_KEY: 'tsk',
};

const contactPayload = {
  firstName: 'James',
  lastName: 'T',
  email: 'james@example.com',
  phone: '',
  subject: 'Hi',
  message: 'Hello',
};

const baseInput: ContactInput = {
  ...contactPayload,
  website: '',
  turnstileToken: 'tok',
};

describe('handleContact', () => {
  beforeEach(() => {
    vi.mocked(sendContactEmail).mockReset();
    vi.mocked(sendContactConfirmation).mockReset();
    vi.mocked(verifyTurnstile).mockReset();
  });

  it('returns success without sending when honeypot is filled', async () => {
    const result = await handleContact({ ...baseInput, website: 'spam' }, env);
    expect(result).toEqual({ success: true, delivered: false });
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(sendContactEmail).not.toHaveBeenCalled();
    expect(sendContactConfirmation).not.toHaveBeenCalled();
  });

  it('throws when Turnstile verification fails', async () => {
    vi.mocked(verifyTurnstile).mockResolvedValue(false);
    await expect(handleContact(baseInput, env)).rejects.toThrow(/verification_failed/);
    expect(sendContactEmail).not.toHaveBeenCalled();
    expect(sendContactConfirmation).not.toHaveBeenCalled();
  });

  it('sends the inbound notice then a visitor confirmation', async () => {
    vi.mocked(verifyTurnstile).mockResolvedValue(true);
    vi.mocked(sendContactEmail).mockResolvedValue();
    vi.mocked(sendContactConfirmation).mockResolvedValue();

    const result = await handleContact(baseInput, env);

    expect(result).toEqual({ success: true, delivered: true });
    expect(verifyTurnstile).toHaveBeenCalledWith('tok', 'tsk');
    expect(sendContactEmail).toHaveBeenCalledWith(contactPayload, env);
    expect(sendContactConfirmation).toHaveBeenCalledWith(contactPayload, env);
    expect(vi.mocked(sendContactEmail).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(sendContactConfirmation).mock.invocationCallOrder[0],
    );
  });

  it('does not send a confirmation if the inbound notice fails', async () => {
    vi.mocked(verifyTurnstile).mockResolvedValue(true);
    vi.mocked(sendContactEmail).mockRejectedValue(new Error('send_failed'));

    await expect(handleContact(baseInput, env)).rejects.toThrow(/send_failed/);
    expect(sendContactConfirmation).not.toHaveBeenCalled();
  });

  it('still succeeds if the confirmation send fails', async () => {
    vi.mocked(verifyTurnstile).mockResolvedValue(true);
    vi.mocked(sendContactEmail).mockResolvedValue();
    vi.mocked(sendContactConfirmation).mockRejectedValue(new Error('suppressed'));

    await expect(handleContact(baseInput, env)).resolves.toEqual({ success: true, delivered: true });
    expect(sendContactEmail).toHaveBeenCalledOnce();
  });
});
