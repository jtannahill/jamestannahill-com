import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendContactEmail, sendContactConfirmation } from '../../src/lib/email';

describe('sendContactEmail', () => {
  const send = vi.fn();
  const env = { EMAIL: { send } };

  const payload = {
    firstName: 'James',
    lastName: 'Tannahill',
    email: 'james@example.com',
    phone: '',
    subject: 'Hello',
    message: 'Hi there',
  };

  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ messageId: 'msg-1' });
  });

  it('sends the inbound notice to contact@ from web@ with the visitor as reply-to', async () => {
    await sendContactEmail(payload, env);

    expect(send).toHaveBeenCalledTimes(1);
    const msg = send.mock.calls[0][0];
    expect(msg.to).toBe('contact@jamestannahill.com');
    expect(msg.from).toEqual({ email: 'web@jamestannahill.com', name: 'James Tannahill' });
    expect(msg.replyTo).toBe('james@example.com');
    expect(msg.subject).toBe('[jamestannahill.com] Hello');
    expect(msg.text).toContain('Name: James Tannahill');
    expect(msg.text).toContain('Email: james@example.com');
    expect(msg.text).toContain('Phone: not provided');
    expect(msg.text).toContain('Hi there');
    expect(msg.html).toContain('James Tannahill');
    expect(msg.html).toContain('Hi there');
  });

  it('collapses line breaks in the subject so they cannot start a new header', async () => {
    await sendContactEmail({ ...payload, subject: 'Hi\r\nBcc: x@example.test' }, env);

    expect(send.mock.calls[0][0].subject).toBe('[jamestannahill.com] Hi Bcc: x@example.test');
  });

  it('escapes single quotes in the HTML body', async () => {
    await sendContactEmail({ ...payload, message: "it's" }, env);

    expect(send.mock.calls[0][0].html).toContain('it&#39;s');
  });

  it('renders a provided phone number in the body', async () => {
    await sendContactEmail({ ...payload, phone: '555-0100' }, env);

    expect(send.mock.calls[0][0].text).toContain('Phone: 555-0100');
  });

  it('propagates a send failure', async () => {
    send.mockRejectedValue(Object.assign(new Error('quota'), { code: 'E_DAILY_LIMIT_EXCEEDED' }));

    await expect(sendContactEmail(payload, env)).rejects.toThrow(/quota/);
  });
});

describe('sendContactConfirmation', () => {
  const send = vi.fn();
  const env = { EMAIL: { send } };

  const payload = {
    firstName: 'James',
    lastName: 'Tannahill',
    email: 'james@example.com',
    phone: '',
    subject: 'Hello',
    message: 'Hi there',
  };

  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ messageId: 'msg-2' });
  });

  it('sends a receipt to the visitor from contact@', async () => {
    await sendContactConfirmation(payload, env);

    expect(send).toHaveBeenCalledTimes(1);
    const msg = send.mock.calls[0][0];
    expect(msg.to).toBe('james@example.com');
    expect(msg.from).toEqual({ email: 'contact@jamestannahill.com', name: 'James Tannahill' });
    expect(msg.subject).toBe('Thanks — I received your message');
    expect(msg.text).toContain('Thanks for writing');
    expect(msg.html).toContain('Thanks for writing');
  });

  it('carries no visitor-supplied text, so the receipt cannot relay content', async () => {
    await sendContactConfirmation(
      {
        ...payload,
        firstName: 'Zq7visitorName',
        lastName: 'Zq7lastName',
        subject: 'Zq7subject https://evil.example.test',
        message: 'Zq7message',
        phone: '555-0100',
      },
      env,
    );

    const msg = send.mock.calls[0][0];
    for (const field of ['Zq7', 'evil.example.test', '555-0100', 'james@example.com']) {
      expect(msg.text).not.toContain(field);
      expect(msg.html).not.toContain(field);
      expect(msg.subject).not.toContain(field);
    }
  });

  it('propagates a send failure', async () => {
    send.mockRejectedValue(new Error('suppressed'));

    await expect(sendContactConfirmation(payload, env)).rejects.toThrow(/suppressed/);
  });
});
