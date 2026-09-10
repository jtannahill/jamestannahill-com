/**
 * Web Bot Auth request signer - RFC 9421 HTTP Message Signatures, web-bot-auth
 * profile. https://datatracker.ietf.org/wg/webbotauth/about/
 *
 * Signs outbound requests as jamestannahill.com so a receiving site can verify
 * them against the JWKS at
 * https://jamestannahill.com/.well-known/http-message-signatures-directory
 *
 * The private key lives OUTSIDE this repo at
 *   ~/.config/jamestannahill-webbotauth/ed25519-private.jwk   (mode 600)
 * or wherever WEB_BOT_AUTH_KEY points. It is never committed and never shipped
 * to the Worker; only the public half is published.
 *
 * Usage as a CLI (prints the headers, does not send anything):
 *   node scripts/webbotauth-sign.mjs https://example.com/some/path
 *
 * Usage as a module:
 *   import { signedFetch, signRequest } from './scripts/webbotauth-sign.mjs';
 *   await signedFetch('https://example.com/');
 */
import { createPrivateKey, sign as nodeSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const SIGNATURE_AGENT = 'https://jamestannahill.com';
/** Seconds a signature stays valid. Short, because these are per-request. */
const TTL = 300;

function loadKey() {
  const path =
    process.env.WEB_BOT_AUTH_KEY ??
    `${homedir()}/.config/jamestannahill-webbotauth/ed25519-private.jwk`;
  let jwk;
  try {
    jwk = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (err) {
    throw new Error(
      `Cannot read the Web Bot Auth private key at ${path}. ` +
        `Set WEB_BOT_AUTH_KEY or regenerate the key pair. (${err.message})`,
    );
  }
  return { key: createPrivateKey({ key: jwk, format: 'jwk' }), kid: jwk.kid };
}

/**
 * Build the RFC 9421 signature base. One line per covered component, then
 * @signature-params last. Component names are lowercase and quoted; the
 * derived component @authority is the request's host[:port].
 */
function signatureBase(url, params) {
  const { host } = new URL(url);
  const lines = [
    `"@authority": ${host}`,
    `"signature-agent": "${SIGNATURE_AGENT}"`,
    `"@signature-params": ${params}`,
  ];
  return lines.join('\n');
}

export function signRequest(url, { label = 'sig1' } = {}) {
  const { key, kid } = loadKey();
  const created = Math.floor(Date.now() / 1000);
  const expires = created + TTL;

  // Covered components, then the parameters. tag identifies the profile.
  const params =
    `("@authority" "signature-agent");created=${created};expires=${expires}` +
    `;keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;

  const base = signatureBase(url, params);
  const signature = nodeSign(null, Buffer.from(base, 'utf-8'), key);

  return {
    'Signature-Agent': `"${SIGNATURE_AGENT}"`,
    'Signature-Input': `${label}=${params}`,
    Signature: `${label}=:${signature.toString('base64')}:`,
  };
}

/** fetch() with the three Web Bot Auth headers attached. */
export function signedFetch(url, init = {}) {
  const headers = new Headers(init.headers ?? {});
  for (const [k, v] of Object.entries(signRequest(url))) headers.set(k, v);
  return fetch(url, { ...init, headers });
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv[2];
  if (!url) {
    console.error('usage: node scripts/webbotauth-sign.mjs <url>');
    process.exit(1);
  }
  for (const [k, v] of Object.entries(signRequest(url))) console.log(`${k}: ${v}`);
}
