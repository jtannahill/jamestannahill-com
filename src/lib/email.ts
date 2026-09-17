export interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface EmailMessage {
  to: string | string[];
  from: string | { email: string; name: string };
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface EmailBinding {
  send(message: EmailMessage): Promise<{ messageId?: string }>;
}

export interface EmailEnv {
  EMAIL: EmailBinding;
}

const INBOX = 'contact@jamestannahill.com';
const WEB_FROM = { email: 'web@jamestannahill.com', name: 'James Tannahill' };
const CONTACT_FROM = { email: 'contact@jamestannahill.com', name: 'James Tannahill' };

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function displayName(p: ContactPayload): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

function phoneLine(phone: string): string {
  return phone.trim() ? phone : 'not provided';
}

function inboundText(p: ContactPayload): string {
  return [
    'New contact form submission from jamestannahill.com',
    '',
    `Name: ${displayName(p)}`,
    `Email: ${p.email}`,
    `Phone: ${phoneLine(p.phone)}`,
    `Subject: ${p.subject}`,
    '',
    'Message:',
    p.message,
    '',
  ].join('\n');
}

function inboundHtml(p: ContactPayload): string {
  const rows = [
    ['Name', displayName(p)],
    ['Email', p.email],
    ['Phone', phoneLine(p.phone)],
    ['Subject', p.subject],
  ]
    .map(
      ([label, value]) =>
        `<tr><th align="left">${label}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  return [
    '<h1>New contact form submission</h1>',
    '<table>',
    rows,
    '</table>',
    '<h2>Message</h2>',
    `<p>${escapeHtml(p.message).replaceAll('\n', '<br>')}</p>`,
  ].join('');
}

function confirmationText(p: ContactPayload): string {
  return [
    `Hi ${p.firstName},`,
    '',
    'Thanks for writing. I received your message and will get back to you.',
    '',
    `Subject: ${p.subject}`,
    '',
    '— James',
    'https://jamestannahill.com',
    '',
  ].join('\n');
}

function confirmationHtml(p: ContactPayload): string {
  return [
    `<p>Hi ${escapeHtml(p.firstName)},</p>`,
    '<p>Thanks for writing. I received your message and will get back to you.</p>',
    `<p>Subject: ${escapeHtml(p.subject)}</p>`,
    '<p>— James<br><a href="https://jamestannahill.com">jamestannahill.com</a></p>',
  ].join('');
}

export async function sendContactEmail(p: ContactPayload, env: EmailEnv): Promise<void> {
  await env.EMAIL.send({
    to: INBOX,
    from: WEB_FROM,
    replyTo: p.email,
    subject: `[jamestannahill.com] ${p.subject}`,
    text: inboundText(p),
    html: inboundHtml(p),
  });
}

export async function sendContactConfirmation(
  p: ContactPayload,
  env: EmailEnv,
): Promise<void> {
  await env.EMAIL.send({
    to: p.email,
    from: CONTACT_FROM,
    subject: 'Thanks — I received your message',
    text: confirmationText(p),
    html: confirmationHtml(p),
  });
}
