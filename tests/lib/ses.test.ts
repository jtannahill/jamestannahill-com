import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendContactEmail } from '../../src/lib/ses';

describe('sendContactEmail', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const env = {
    AWS_ACCESS_KEY_ID: 'AKIATEST',
    AWS_SECRET_ACCESS_KEY: 'secret',
  };

  const payload = {
    firstName: 'James',
    lastName: 'Tannahill',
    email: 'james@example.com',
    phone: '',
    subject: 'Hello',
    message: 'Hi there',
  };

  it('POSTs to the SES endpoint with the expected body', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 200 }));

    await sendContactEmail(payload, env);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://email.us-east-1.amazonaws.com/');
    expect(init.method).toBe('POST');

    const body = init.body.toString();
    expect(body).toContain('Action=SendEmail');
    expect(body).toContain('Source=web%40jamestannahill.com');
    expect(body).toContain('Destination.ToAddresses.member.1=web%40jamestannahill.com');
    expect(body).toContain(`Message.Subject.Data=${encodeURIComponent('[jamestannahill.com] Hello')}`);
    expect(body).toContain(encodeURIComponent('James Tannahill'));
    expect(body).toContain('ReplyToAddresses.member.1=james%40example.com');
  });

  it('renders "not provided" when phone is empty', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 200 }));

    await sendContactEmail(payload, env);

    const body = fetchMock.mock.calls[0][1].body.toString();
    expect(body).toContain(encodeURIComponent('Phone: not provided'));
  });

  it('throws when SES returns non-2xx', async () => {
    fetchMock.mockResolvedValue(new Response('Throttling', { status: 400 }));

    await expect(sendContactEmail(payload, env)).rejects.toThrow(/SES 400/);
  });
});
