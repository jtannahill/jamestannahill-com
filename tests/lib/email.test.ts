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
    expect(msg.text).toContain('James');
    expect(msg.text).toContain('Hello');
    expect(msg.html).toContain('James');
    expect(msg.html).toContain('Hello');
  });

  it('propagates a send failure', async () => {
    send.mockRejectedValue(new Error('suppressed'));

    await expect(sendContactConfirmation(payload, env)).rejects.toThrow(/suppressed/);
  });
});
