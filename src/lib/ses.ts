import { AwsClient } from 'aws4fetch';

export interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface SesEnv {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
}

const REGION = 'us-east-1';
const ADDRESS = 'web@jamestannahill.com';
const SES_URL = `https://email.${REGION}.amazonaws.com/`;

/** Encode key=value pairs using encodeURIComponent (produces %20, not +). */
function encodeParams(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

export async function sendContactEmail(p: ContactPayload, env: SesEnv): Promise<void> {
  const aws = new AwsClient({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: REGION,
    service: 'ses',
  });

  const text = [
    'New contact form submission from jamestannahill.com',
    '',
    `Name: ${p.firstName} ${p.lastName}`.trimEnd(),
    `Email: ${p.email}`,
    `Phone: ${p.phone || 'not provided'}`,
    `Subject: ${p.subject}`,
    '',
    'Message:',
    p.message,
    '',
  ].join('\n');

  const body = encodeParams({
    Action: 'SendEmail',
    Source: ADDRESS,
    'Destination.ToAddresses.member.1': ADDRESS,
    'Message.Subject.Data': `[jamestannahill.com] ${p.subject}`,
    'Message.Body.Text.Data': text,
    'ReplyToAddresses.member.1': p.email,
  });

  // Sign the request — aws4fetch returns a signed Request object
  const signed = await aws.sign(SES_URL, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  // Extract signed headers and call fetch(url, init) so tests can intercept
  // the two-argument form: fetch(url, { method, headers, body })
  const headers: Record<string, string> = {};
  signed.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const res = await fetch(SES_URL, {
    method: 'POST',
    headers,
    body,
  });

  if (!res.ok) {
    const resBody = await res.text();
    throw new Error(`SES ${res.status}: ${resBody}`);
  }
}
