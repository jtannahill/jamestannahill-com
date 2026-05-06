# Astro Actions Contact Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static-site + API Gateway + Lambda contact form with a single Cloudflare Worker running the full Astro 6 app, using Astro Actions for type-safe form handling and SES (via `aws4fetch`) as the email transport.

**Architecture:** Switch `astro.config.mjs` to `output: 'server'` with `@astrojs/cloudflare`. One Worker serves static assets and the Action endpoint. Business logic lives in pure functions (`handleContact`, `sendContactEmail`, `verifyTurnstile`) so Vitest can unit-test without spinning up Astro's runtime. Action wrapper is a thin shim. Cutover is two DNS records; rollback is reverting the same two records.

**Tech Stack:** Astro 6, `@astrojs/cloudflare`, Cloudflare Workers, `aws4fetch` (SES SigV4), Cloudflare Turnstile, Vitest, Wrangler. AWS SES kept as the email transport.

**Reference spec:** `docs/superpowers/specs/2026-05-06-astro-actions-contact-form-design.md`

---

## File Structure

**New files:**
- `src/lib/ses.ts` — `sendContactEmail(payload, env)` calls SES `SendEmail` via `aws4fetch`
- `src/lib/turnstile.ts` — `verifyTurnstile(token, secret)` POSTs to siteverify
- `src/actions/contact-handler.ts` — pure `handleContact(input, env)` orchestration (honeypot → Turnstile → SES)
- `src/actions/index.ts` — Astro Action wrapper (`defineAction`) that pulls env from runtime locals and calls `handleContact`
- `src/env.d.ts` — extends Astro's `App.Locals` with `runtime.env` typing
- `wrangler.toml` — Worker config
- `vitest.config.ts` — Vitest config
- `tests/lib/turnstile.test.ts`
- `tests/lib/ses.test.ts`
- `tests/actions/contact-handler.test.ts`
- `.dev.vars.example` — template for local dev secrets

**Modified files:**
- `package.json` — deps + test script
- `astro.config.mjs` — `output: 'server'`, `adapter: cloudflare()`
- `src/components/ContactForm.astro` — replace inline `fetch` with Astro Action; add honeypot input + Turnstile widget
- `tsconfig.json` — include `tests/**/*.ts` only if needed (verify after Task 1)

**Removed (post-cutover, Task 13):**
- `cdk/lib/contact-stack.ts`
- `cdk/lib/static-site-stack.ts`
- `cdk/lambda/contact/`
- `cdk/bin/app.ts` references to the two deleted stacks
- CloudFront distribution `d9ttkh3tz30f6` and its S3 origin bucket

---

## Task 1: Install dependencies and Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install runtime + dev deps**

```bash
cd /Users/jamest/jamestannahill-com
npm install @astrojs/cloudflare aws4fetch
npm install -D vitest @types/node wrangler
```

- [ ] **Step 2: Add `test` script to package.json**

In `package.json`, add `"test": "vitest run"` to the `scripts` block.

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Verify Vitest runs (no tests yet)**

Run: `npm test`
Expected: `No test files found, exiting with code 1` (or similar). The runner is wired up.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add @astrojs/cloudflare, aws4fetch, vitest, wrangler"
```

---

## Task 2: SES wrapper (TDD)

**Files:**
- Create: `src/lib/ses.ts`
- Test: `tests/lib/ses.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/lib/ses.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/ses.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/lib/ses"`.

- [ ] **Step 3: Implement `src/lib/ses.ts`**

```ts
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

  const params = new URLSearchParams({
    Action: 'SendEmail',
    Source: ADDRESS,
    'Destination.ToAddresses.member.1': ADDRESS,
    'Message.Subject.Data': `[jamestannahill.com] ${p.subject}`,
    'Message.Body.Text.Data': text,
    'ReplyToAddresses.member.1': p.email,
  });

  const res = await aws.fetch(`https://email.${REGION}.amazonaws.com/`, {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SES ${res.status}: ${body}`);
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/lib/ses.test.ts`
Expected: 3 passing.

Note: `aws4fetch`'s `AwsClient.fetch` ultimately calls `globalThis.fetch`, so the `vi.stubGlobal('fetch', ...)` mock intercepts it.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ses.ts tests/lib/ses.test.ts
git commit -m "feat: SES wrapper using aws4fetch for Worker runtime"
```

---

## Task 3: Turnstile verifier (TDD)

**Files:**
- Create: `src/lib/turnstile.ts`
- Test: `tests/lib/turnstile.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/lib/turnstile.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/turnstile.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/turnstile.ts`**

```ts
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
  try {
    const res = await fetch(SITEVERIFY, {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/lib/turnstile.test.ts`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/turnstile.ts tests/lib/turnstile.test.ts
git commit -m "feat: Turnstile siteverify helper"
```

---

## Task 4: Contact handler pure function (TDD)

**Files:**
- Create: `src/actions/contact-handler.ts`
- Test: `tests/actions/contact-handler.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/actions/contact-handler.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/actions/contact-handler.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/actions/contact-handler.ts`**

```ts
import { sendContactEmail } from '../lib/ses';
import { verifyTurnstile } from '../lib/turnstile';

export interface ContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  website: string;
  turnstileToken: string;
}

export interface HandlerEnv {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  TURNSTILE_SECRET_KEY: string;
}

export async function handleContact(
  input: ContactInput,
  env: HandlerEnv,
): Promise<{ success: true }> {
  if (input.website) {
    return { success: true };
  }

  const ok = await verifyTurnstile(input.turnstileToken, env.TURNSTILE_SECRET_KEY);
  if (!ok) {
    throw new Error('verification_failed');
  }

  await sendContactEmail(
    {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
    },
    env,
  );

  return { success: true };
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/actions/contact-handler.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/actions/contact-handler.ts tests/actions/contact-handler.test.ts
git commit -m "feat: contact-handler orchestrates honeypot, Turnstile, SES"
```

---

## Task 5: Astro Action wrapper

**Files:**
- Create: `src/actions/index.ts`
- Create: `src/env.d.ts`

- [ ] **Step 1: Create `src/env.d.ts`**

```ts
/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

type Env = {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  TURNSTILE_SECRET_KEY: string;
};

declare namespace App {
  interface Locals extends Runtime<Env> {}
}
```

(The `Runtime` helper is provided by `@astrojs/cloudflare` and types `locals.runtime.env`.)

- [ ] **Step 2: Create `src/actions/index.ts`**

```ts
import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { handleContact } from './contact-handler';

export const server = {
  sendContact: defineAction({
    accept: 'form',
    input: z.object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().optional().default(''),
      email: z.string().email('Valid email required'),
      phone: z.string().optional().default(''),
      subject: z.string().optional().default('(no subject)'),
      message: z.string().min(1, 'Message is required'),
      website: z.string().optional().default(''),
      'cf-turnstile-response': z.string().min(1, 'Verification required'),
    }),
    handler: async (input, context) => {
      const env = context.locals.runtime.env;
      try {
        return await handleContact(
          {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            subject: input.subject,
            message: input.message,
            website: input.website,
            turnstileToken: input['cf-turnstile-response'],
          },
          env,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown';
        if (msg === 'verification_failed') {
          throw new ActionError({ code: 'BAD_REQUEST', message: 'verification_failed' });
        }
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'send_failed' });
      }
    },
  }),
};
```

- [ ] **Step 3: Type-check**

Run: `npx astro check`
Expected: 0 errors. (Astro must be reconfigured for server output before this passes — if check complains about Action requiring server output, defer this verification to after Task 6.)

- [ ] **Step 4: Commit**

```bash
git add src/actions/index.ts src/env.d.ts
git commit -m "feat: sendContact Astro Action wrapping contact-handler"
```

---

## Task 6: Astro config — switch to server output + Cloudflare adapter

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Replace `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://www.jamestannahill.com',
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
  redirects: {
    '/about': '/',
    '/insights': 'https://www.plocamium.com/globals',
  },
  integrations: [
    sitemap({
      serialize(item) {
        const today = new Date().toISOString().split('T')[0];
        item.lastmod = today;
        if (item.url === 'https://www.jamestannahill.com/') {
          item.priority = 1.0;
          item.changefreq = 'monthly';
        } else if (item.url.includes('/faqs')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        } else {
          item.priority = 0.3;
          item.changefreq = 'yearly';
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 2: Mark every page as prerendered (keep them static)**

Add `export const prerender = true;` to the frontmatter of every `.astro` page in `src/pages/` so they remain prerendered HTML and only the Action route runs at request time.

Pages to update (verify via `ls src/pages/`):
- `src/pages/index.astro`
- `src/pages/accessibility.astro`
- `src/pages/404.astro`
- `src/pages/faqs.astro`
- `src/pages/privacy.astro`
- `src/pages/terms.astro`

For each page, add this block at the very top of the frontmatter (before any imports):

```astro
---
export const prerender = true;
// existing frontmatter follows
---
```

- [ ] **Step 3: Build to verify config is valid**

Run: `npm run build`
Expected: Build succeeds. Output in `dist/` should contain `_worker.js` (the Worker entry) and `_astro/` static assets.

- [ ] **Step 4: Run `astro check` again**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs src/pages/
git commit -m "feat: switch to server output with Cloudflare adapter; prerender all pages"
```

---

## Task 7: Wrangler config

**Files:**
- Create: `wrangler.toml`
- Create: `.dev.vars.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create `wrangler.toml`**

```toml
name = "jamestannahill-com"
compatibility_date = "2026-05-01"
compatibility_flags = ["nodejs_compat"]
main = "./dist/_worker.js/index.js"
assets = { directory = "./dist", binding = "ASSETS" }

# Custom domains added in Task 12 after smoke test passes:
# routes = [
#   { pattern = "jamestannahill.com", custom_domain = true },
#   { pattern = "www.jamestannahill.com", custom_domain = true },
# ]
```

- [ ] **Step 2: Create `.dev.vars.example`**

```
AWS_ACCESS_KEY_ID=replace-me
AWS_SECRET_ACCESS_KEY=replace-me
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

(That Turnstile secret is Cloudflare's official "always passes" testing key — safe to commit as the example.)

- [ ] **Step 3: Add `.dev.vars` to `.gitignore`**

Append to `.gitignore`:

```
.dev.vars
```

- [ ] **Step 4: Commit**

```bash
git add wrangler.toml .dev.vars.example .gitignore
git commit -m "feat: wrangler config + dev.vars template"
```

---

## Task 8: Update ContactForm component

**Files:**
- Modify: `src/components/ContactForm.astro`

- [ ] **Step 1: Replace the component contents**

Full replacement for `src/components/ContactForm.astro`:

```astro
---
import { actions } from 'astro:actions';

const TURNSTILE_SITE_KEY = '1x00000000000000000000AA'; // Cloudflare always-passes test key — replace in Task 11.
---
<div class="max-w-2xl">
  <h2 class="text-2xl font-bold mb-2 text-white" style="font-family:'NHG Display',sans-serif;">Get in Touch</h2>
  <form
    id="contact-form"
    method="POST"
    action={actions.sendContact}
    class="space-y-6 md:space-y-10 mt-8"
  >
    <div class="grid sm:grid-cols-2 gap-6 sm:gap-10">
      <div>
        <label class="block text-[11px] uppercase tracking-wider mb-3" style="color:rgba(255,255,255,0.45);" for="firstName">First Name *</label>
        <input id="firstName" name="firstName" type="text" required
               class="w-full bg-transparent text-white text-sm focus:outline-none pb-3"
               style="border:none; border-bottom:1px solid rgba(255,255,255,0.25);" />
      </div>
      <div>
        <label class="block text-[11px] uppercase tracking-wider mb-3" style="color:rgba(255,255,255,0.45);" for="lastName">Last Name *</label>
        <input id="lastName" name="lastName" type="text" required
               class="w-full bg-transparent text-white text-sm focus:outline-none pb-3"
               style="border:none; border-bottom:1px solid rgba(255,255,255,0.25);" />
      </div>
    </div>
    <div class="grid sm:grid-cols-2 gap-6 sm:gap-10">
      <div>
        <label class="block text-[11px] uppercase tracking-wider mb-3" style="color:rgba(255,255,255,0.45);" for="email">Email *</label>
        <input id="email" name="email" type="email" required
               class="w-full bg-transparent text-white text-sm focus:outline-none pb-3"
               style="border:none; border-bottom:1px solid rgba(255,255,255,0.25);" />
      </div>
      <div>
        <label class="block text-[11px] uppercase tracking-wider mb-3" style="color:rgba(255,255,255,0.45);" for="phone">Phone</label>
        <input id="phone" name="phone" type="tel"
               class="w-full bg-transparent text-white text-sm focus:outline-none pb-3"
               style="border:none; border-bottom:1px solid rgba(255,255,255,0.25);" />
      </div>
    </div>
    <div>
      <label class="block text-[11px] uppercase tracking-wider mb-3" style="color:rgba(255,255,255,0.45);" for="subject">Subject</label>
      <input id="subject" name="subject" type="text" required
             class="w-full bg-transparent text-white text-sm focus:outline-none pb-3"
             style="border:none; border-bottom:1px solid rgba(255,255,255,0.25);" />
    </div>
    <div>
      <label class="block text-[11px] uppercase tracking-wider mb-3" style="color:rgba(255,255,255,0.45);" for="message">Message</label>
      <textarea id="message" name="message" rows="4" required
                class="w-full bg-transparent text-white text-sm focus:outline-none resize-none pb-3"
                style="border:none; border-bottom:1px solid rgba(255,255,255,0.25);"></textarea>
    </div>

    {/* Honeypot — visually hidden, ignored by humans, filled by dumb bots */}
    <div aria-hidden="true" style="position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden;">
      <label for="website">Website</label>
      <input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
    </div>

    {/* Turnstile widget renders into this div once the script loads */}
    <div class="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY}></div>

    <button type="submit" id="contact-submit"
            class="px-8 py-3 min-h-[44px] text-white text-[13px] tracking-[0.18em] uppercase"
            style="background:var(--color-amber);">
      Send Message
    </button>
    <p id="contact-success" class="hidden text-sm" style="color:var(--color-amber);">
      ✓ Message sent. I'll be in touch.
    </p>
    <p id="contact-error" class="hidden text-sm" style="color:#f87171;">
      Something went wrong. Please email web@jamestannahill.com directly.
    </p>
  </form>
</div>

<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer is:inline></script>

<script>
  import { actions, isInputError } from 'astro:actions';

  const form = document.getElementById('contact-form') as HTMLFormElement;
  const btn = document.getElementById('contact-submit') as HTMLButtonElement;
  const success = document.getElementById('contact-success')!;
  const error = document.getElementById('contact-error')!;

  form?.querySelectorAll('input, textarea').forEach((el) => {
    el.addEventListener('focus', () => (el as HTMLElement).style.borderBottomColor = 'var(--color-amber)');
    el.addEventListener('blur',  () => (el as HTMLElement).style.borderBottomColor = 'rgba(255,255,255,0.25)');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.textContent = 'Sending...';
    btn.disabled = true;
    success.classList.add('hidden');
    error.classList.add('hidden');

    const formData = new FormData(form);
    const { error: actionError } = await actions.sendContact(formData);

    if (actionError) {
      error.classList.remove('hidden');
    } else {
      form.reset();
      success.classList.remove('hidden');
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'form_submit', { form_id: 'contact', status: 'success' });
      }
    }

    btn.textContent = 'Send Message';
    btn.disabled = false;
  });
</script>
```

Notes:
- The form has `method="POST"` and `action={actions.sendContact}` so it works without JS (progressive enhancement). The client script intercepts and uses the typed Action client when JS is available.
- Honeypot field name is `website`. Real users won't see it; bots will fill it.
- Turnstile site key is the Cloudflare always-passes test key for now; Task 11 swaps it for the real one.

- [ ] **Step 2: Build to verify the component compiles**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ContactForm.astro
git commit -m "feat: ContactForm uses sendContact Action with honeypot + Turnstile"
```

---

## Task 9: Local smoke test

**Files:**
- Create: `.dev.vars` (gitignored)

- [ ] **Step 1: Create local `.dev.vars` with test values**

Copy `.dev.vars.example` to `.dev.vars`. The Turnstile test secret already passes any token. Use real AWS keys (Task 11 will create the scoped IAM user, but for local you can use existing dev creds *only if they have ses:SendEmail*).

If you don't yet have AWS keys with SES permission, skip the SES portion of this test for now: comment out the `await sendContactEmail(...)` line in `src/actions/contact-handler.ts` and re-test after Task 11. **Do not commit that change.**

- [ ] **Step 2: Run dev server**

Run: `npm run dev`
Expected: Astro dev server starts on `http://localhost:4321`.

- [ ] **Step 3: Submit the form in a browser**

Open `http://localhost:4321/`, scroll to the contact form, fill it out, submit.

Expected:
- Turnstile widget renders (test key always passes)
- Submit succeeds
- Success message appears
- If real AWS creds present: email arrives at `web@jamestannahill.com`

- [ ] **Step 4: Run all tests one more time**

Run: `npm test`
Expected: 10 passing (3 SES + 4 Turnstile + 3 contact-handler).

- [ ] **Step 5: No commit (local-only setup)**

`.dev.vars` is gitignored; nothing to commit.

---

## Task 10: AWS IAM user + Turnstile site provisioning

**This task requires AWS Console / Cloudflare Dashboard access. Cannot be fully automated — agentic worker should pause here and report.**

- [ ] **Step 1: Create scoped IAM user via AWS CLI**

```bash
aws iam create-user --user-name jamestannahill-com-worker

aws iam put-user-policy --user-name jamestannahill-com-worker \
  --policy-name SendContactEmail \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": "ses:SendEmail",
      "Resource": "arn:aws:ses:us-east-1:*:identity/jamestannahill.com",
      "Condition": {
        "StringEquals": {
          "ses:FromAddress": "web@jamestannahill.com"
        }
      }
    }]
  }'

aws iam create-access-key --user-name jamestannahill-com-worker
```

Save the returned `AccessKeyId` and `SecretAccessKey` — you'll set them as Worker secrets in Task 11.

- [ ] **Step 2: Create Cloudflare Turnstile site**

In the Cloudflare Dashboard → Turnstile → Add site:
- Site name: `jamestannahill.com`
- Domains: `jamestannahill.com`, `www.jamestannahill.com`, `jamestannahill-com.<your-account>.workers.dev` (for preview testing)
- Widget mode: Managed
- Save and copy the **Site Key** and **Secret Key**.

- [ ] **Step 3: Replace the test site key in `ContactForm.astro`**

Edit `src/components/ContactForm.astro` line that reads:

```astro
const TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
```

Replace with the real site key from Step 2.

- [ ] **Step 4: Commit the site key**

(The Turnstile site key is public.)

```bash
git add src/components/ContactForm.astro
git commit -m "feat: use production Turnstile site key"
```

---

## Task 11: Deploy preview Worker + smoke test

- [ ] **Step 1: Authenticate Wrangler**

Run: `npx wrangler login`
Expected: Browser opens, OAuth flow completes.

- [ ] **Step 2: Set Worker secrets**

Run each, paste the value when prompted:

```bash
npx wrangler secret put AWS_ACCESS_KEY_ID
npx wrangler secret put AWS_SECRET_ACCESS_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY
```

- [ ] **Step 3: Build and deploy**

```bash
npm run build
npx wrangler deploy
```

Expected output: A `*.workers.dev` URL like `https://jamestannahill-com.<account>.workers.dev`.

- [ ] **Step 4: Smoke test the preview URL**

Open the preview URL in a browser:
- Navigate to the contact form
- Verify Turnstile renders and resolves
- Submit a test message
- Verify success message appears
- Verify email arrives at `web@jamestannahill.com` with correct From, Reply-To, Subject prefix, and body format
- Submit a second test with the honeypot field manually set (use DevTools to set `#website` value): expect success message but no email
- Submit with Turnstile bypassed (delete the response input via DevTools): expect failure message

- [ ] **Step 5: No commit (deploy is out-of-tree)**

---

## Task 12: Add Workers Custom Domains + DNS flip

**This task is the production cutover. Pause for human approval before flipping DNS.**

- [ ] **Step 1: Uncomment custom-domain routes in `wrangler.toml`**

Replace the comment block with:

```toml
routes = [
  { pattern = "jamestannahill.com", custom_domain = true },
  { pattern = "www.jamestannahill.com", custom_domain = true },
]
```

- [ ] **Step 2: Redeploy**

```bash
npx wrangler deploy
```

Expected: Wrangler reports the two custom domains being attached. Cloudflare provisions TLS certs (usually <60s).

- [ ] **Step 3: Verify the Worker is responding on the custom domains**

Cloudflare will create routing entries. Before flipping DNS, verify TLS:

```bash
curl -sSI https://jamestannahill.com | head -5
curl -sSI https://www.jamestannahill.com | head -5
```

If DNS is still pointing to CloudFront, these will hit the old site — that's expected. The Workers Custom Domain entry is provisioned but inert until DNS resolves to it.

- [ ] **Step 4: Flip DNS in the Cloudflare dashboard**

In Cloudflare → DNS → Records for `jamestannahill.com`:
- Find the apex `@` record (currently CNAME or A pointing to the CloudFront distro `d9ttkh3tz30f6.cloudfront.net` or `52.85.x.x` IPs).
- Change it to a CNAME pointing to `jamestannahill-com.<account>.workers.dev` (or whatever Wrangler reported), proxied.
- Same for the `www` record.

Wait 60 seconds for DNS to propagate (Cloudflare DNS is near-instant when proxied).

- [ ] **Step 5: Verify production**

```bash
curl -sSI https://www.jamestannahill.com | grep -i 'server\|cf-ray'
```

Expected: `cf-ray` header present (request hit Cloudflare); the `server` header should reflect Cloudflare/Worker, not CloudFront.

Open the site in a browser, submit a test contact form, verify email arrives.

- [ ] **Step 6: No commit (DNS is dashboard-managed)**

---

## Task 13: 48-hour monitoring + retire AWS infra

**Wait 48 hours after Task 12 before retiring AWS infra. Verify no issues during the window.**

- [ ] **Step 1: After 48h, confirm no regressions**

Check:
- `wrangler tail` for any 5xx errors during the window
- Inbox for missed contact submissions
- Direct browser test of `https://www.jamestannahill.com/` and the form

- [ ] **Step 2: Destroy contact CDK stack**

```bash
cd /Users/jamest/jamestannahill-com/cdk
npx cdk destroy ContactStack --force
```

- [ ] **Step 3: Destroy static-site CDK stack**

```bash
npx cdk destroy StaticSiteStack --force
```

This will fail if the S3 bucket has versioned objects. If so:

```bash
aws s3 rm s3://<bucket-name> --recursive
aws s3api delete-objects --bucket <bucket-name> --delete "$(aws s3api list-object-versions --bucket <bucket-name> --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}')"
npx cdk destroy StaticSiteStack --force
```

- [ ] **Step 4: Delete files in the repo that referenced retired infra**

```bash
cd /Users/jamest/jamestannahill-com
rm cdk/lib/contact-stack.ts cdk/lib/static-site-stack.ts
rm -rf cdk/lambda/contact
```

Edit `cdk/bin/app.ts` to remove the `new ContactStack(...)` and `new StaticSiteStack(...)` lines and their imports. If the file becomes empty (no remaining stacks), delete the entire `cdk/` directory and its `package.json` + `tsconfig.json`.

- [ ] **Step 5: Verify**

Run: `npm run build && npm test`
Expected: All tests still pass; build still succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: retire CDK contact/static-site stacks after Workers cutover"
```

- [ ] **Step 7: Update memory entry**

(Manual step for the operator, not the agent.) Update `~/.claude/projects/-Users-jamest/memory/jamestannahill-com.md` with the new architecture: "Astro 6 on Cloudflare Workers; SES via aws4fetch; Turnstile + honeypot; CloudFront/S3 retired."

---

## Done

When all tasks are checked, the contact form runs as an Astro Action on a Cloudflare Worker, the AWS contact-form Lambda + API Gateway + CloudFront distro + S3 bucket are gone, and the existing email behavior (subject, body, From/To/Reply-To) is preserved.
