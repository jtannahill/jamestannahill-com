import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleContact, type ContactInput, type HandlerEnv } from '../../src/actions/contact-handler';

vi.mock('../../src/lib/ses', () => ({
  sendContactEmail: vi.fn(),
}));
vi.mock('../../src/lib/turnstile', () => ({
  verifyTurnstile: vi.fn(),
}));

import { sendContactEmail } from '../../src/lib/ses';
import { verifyTurnstile } from '../../src/lib/turnstile';

const env: HandlerEnv = {
  AWS_ACCESS_KEY_ID: 'AKIATEST',
  AWS_SECRET_ACCESS_KEY: 'secret',
  TURNSTILE_SECRET_KEY: 'tsk',
};

const baseInput: ContactInput = {
  firstName: 'James',
  lastName: 'T',
  email: 'james@example.com',
  phone: '',
  subject: 'Hi',
  message: 'Hello',
  website: '',
  turnstileToken: 'tok',
};

describe('handleContact', () => {
  beforeEach(() => {
    vi.mocked(sendContactEmail).mockReset();
    vi.mocked(verifyTurnstile).mockReset();
  });

  it('returns success without calling SES when honeypot is filled', async () => {
    const result = await handleContact({ ...baseInput, website: 'spam' }, env);
    expect(result).toEqual({ success: true });
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('throws when Turnstile verification fails', async () => {
    vi.mocked(verifyTurnstile).mockResolvedValue(false);
    await expect(handleContact(baseInput, env)).rejects.toThrow(/verification_failed/);
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('calls SES with the input payload on success', async () => {
    vi.mocked(verifyTurnstile).mockResolvedValue(true);
    vi.mocked(sendContactEmail).mockResolvedValue();

    const result = await handleContact(baseInput, env);

    expect(result).toEqual({ success: true });
    expect(verifyTurnstile).toHaveBeenCalledWith('tok', 'tsk');
    expect(sendContactEmail).toHaveBeenCalledWith(
      {
        firstName: 'James',
        lastName: 'T',
        email: 'james@example.com',
        phone: '',
        subject: 'Hi',
        message: 'Hello',
      },
      env,
    );
  });
});
