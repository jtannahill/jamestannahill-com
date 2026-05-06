# Astro Actions Contact Form on Cloudflare Workers

**Date:** 2026-05-06
**Status:** Approved (design)

## Goal

Replace the static-site + API Gateway + Lambda contact-form architecture with a single Cloudflare Worker running the full Astro 6 app. Use Astro Actions for the form so validation is type-safe end-to-end, and consolidate the deploy stack down to one target.

## Why

Today the site is static (S3 + CloudFront) and the contact form makes a browser `fetch` to a separate AWS API Gateway → Lambda → SES path. That's three deploy surfaces (CloudFront, API Gateway, Lambda) for one personal site. Astro 6 + the Cloudflare adapter collapses this to one Worker, and Astro Actions give us a typed, schema-validated form handler instead of hand-rolled JSON over `fetch`.

## Existing behavior to preserve

From `cdk/lambda/contact/handler.py`:

- From/To: `web@jamestannahill.com`
- Reply-To: the submitter's email
- Subject line: `[jamestannahill.com] {subject}`
- Required fields: `firstName`, `email`, `message`
- Plain-text body containing first/last name, email, phone, subject, message

## Architecture

- `astro.config.mjs` switches `output: 'static'` → `'server'` and adds `@astrojs/cloudflare`.
- One Cloudflare Worker serves static assets (Workers Static Assets) and the Action endpoint.
- DNS for `jamestannahill.com` and `www.jamestannahill.com` flips from CloudFront `d9ttkh3tz30f6` to a Workers Custom Domain. All other subdomains (`map.`, `fonts.`, `contact.`, `art.`, etc.) are independent records and are untouched.
- Email transport stays SES, called from the Worker via `aws4fetch` (lightweight SigV4 helper) — the AWS SDK is too heavy for the Workers runtime.
- Anti-spam: honeypot field + Cloudflare Turnstile.

## Components

### New

- `src/actions/index.ts` — defines `sendContact` Astro Action with a Zod schema matching existing required fields (`firstName`, `email`, `message`) and optional fields (`lastName`, `phone`, `subject`, plus `honeypot` and `turnstileToken`).
- `src/lib/ses.ts` — thin wrapper around SES `SendEmail` using `aws4fetch`. Reads region (`us-east-1`), credentials, and From/To from env. ~30 lines.
- `src/lib/turnstile.ts` — POSTs the token to `https://challenges.cloudflare.com/turnstile/v0/siteverify` and returns success/failure.
- `wrangler.toml` — Worker name, `compatibility_date`, custom-domain routes for `jamestannahill.com` and `www.jamestannahill.com`, secret bindings.

### Modified

- `src/components/ContactForm.astro`
  - Replace the inline `<script>` `fetch` to `a1swgpk2ba.execute-api.us-east-1.amazonaws.com` with a call to the typed Action client (`actions.sendContact`).
  - Add a hidden `<input name="website">` honeypot (visually hidden via CSS, autocomplete=off, tabindex=-1).
  - Add the Turnstile widget div (`cf-turnstile` class) with the public site key.
  - Keep the existing success / error UI elements (`#contact-success`, `#contact-error`, button label swap).
  - Keep progressive enhancement: the form still POSTs natively if JS fails to load — Astro Actions support this with the `action={actions.sendContact}` form attribute.
- `astro.config.mjs`
  - `output: 'server'`
  - Add `@astrojs/cloudflare` adapter import + `adapter: cloudflare({...})`
  - Existing `sitemap` integration and `tailwindcss` Vite plugin stay as-is.

### Removed (post-cutover)

- `cdk/lib/contact-stack.ts`
- `cdk/lib/static-site-stack.ts`
- `cdk/lambda/contact/`
- The CloudFront distribution `d9ttkh3tz30f6` and its S3 origin bucket
- The `bin/app.ts` references to the two stacks above

## Submit flow

1. Browser submits form to the Astro Action endpoint (`actions.sendContact`).
2. Action validates the FormData against the Zod schema. Validation errors return as typed field errors.
3. If `honeypot` is non-empty, return a fake `{ success: true }` and do nothing — bots don't learn they were caught.
4. POST `turnstileToken` to Cloudflare's siteverify endpoint with `TURNSTILE_SECRET_KEY`. On failure, return a `verification_failed` error.
5. Build the email body in the same format as the existing Lambda. Call `SendEmail` on SES via signed fetch using `aws4fetch`.
6. Return `{ success: true }` or a typed error. Client toggles existing success/error elements.

## Secrets

Set via `wrangler secret put`:

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — new IAM user, policy: `ses:SendEmail` only, scoped to the `web@jamestannahill.com` SES identity ARN.
- `TURNSTILE_SECRET_KEY` — from Cloudflare dashboard.

The Turnstile site key is public and inlined in the component.

## Error handling

| Scenario | Server response | Client behavior |
|---|---|---|
| Zod validation fails | 400 with field errors | Show field-level inline message |
| Honeypot tripped | 200 fake success | Show generic success (don't tip off bots) |
| Turnstile fails | 400 `verification_failed` | Show "verification failed, please retry" |
| SES throws | 500 | Show existing fallback: "email web@jamestannahill.com directly" |

## Testing

- **Local dev:** `astro dev` with `MOCK_SES=1` env flag that logs the email payload to console instead of calling SES. Turnstile bypassed on `localhost`.
- **Preview:** Deploy Worker to `*.workers.dev` URL; full end-to-end with real SES (sandbox-verified `web@jamestannahill.com`) and real Turnstile.
- **Production:** Same Worker, custom domains bound after smoke test.

## Migration / cutover

1. Feature branch: add adapter, Action, lib helpers, Wrangler config.
2. `wrangler deploy` to a `*.workers.dev` preview URL.
3. Smoke test: submit form, verify email arrives, verify honeypot/Turnstile both block as expected.
4. Add Workers Custom Domains for `jamestannahill.com` and `www.jamestannahill.com` (Cloudflare provisions TLS certs).
5. In Cloudflare DNS, flip apex `@` and `www` records from `d9ttkh3tz30f6.cloudfront.net` to the Worker. Other subdomain records (`map.`, `fonts.`, `contact.`, `art.`, etc.) are not touched.
6. Monitor for 48 hours. Rollback = re-point the two DNS records back to the CloudFront distro.
7. Retire AWS infra: `cdk destroy ContactStack StaticSiteStack`, then delete the CloudFront distribution and empty + delete the S3 origin bucket.

## Risks

- **Worker bundle size:** `aws4fetch` is ~3KB; total bundle expected well under the 1MB Workers limit.
- **Cold start:** Cloudflare Workers cold-start is ~5ms, faster than the current Python Lambda. No regression.
- **DNS blast radius:** Only the two records (`@` and `www`) change. Other subdomains keep their independent records pointing to their own CloudFront distros.
- **SES sending identity:** Continue using the same verified `web@jamestannahill.com` identity. No DNS or domain re-verification required.

## Out of scope (YAGNI)

- Confirmation email to the sender — existing form doesn't have one; add later if desired.
- Submission logging (DynamoDB / KV / D1) — SES inbox is the source of truth.
- Rate limiting beyond Turnstile — add KV-based per-IP limit only if abuse appears.
- Migrating any other subdomain or service to Workers — out of scope.
