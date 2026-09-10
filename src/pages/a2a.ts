/**
 * A2A agent endpoint - https://a2a-protocol.org/latest/specification/
 *
 * JSON-RPC 2.0 over HTTP. Deliberately small and stateless: it answers about
 * this site and nothing else, from the corpus in src/lib/agent-corpus.ts.
 *
 * Supported methods:
 *   message/send  - takes a user Message, returns an agent Message
 *   tasks/get     - always TaskNotFound; nothing here is long-running, so no
 *                   task is ever created to be fetched later
 *
 * Not supported, and declared as such on the agent card: streaming
 * (message/stream), push notifications, and task cancellation.
 */
import type { APIRoute } from 'astro';
import {
  corpus,
  findFaqs,
  findVenture,
  identity,
  searchCorpus,
  ventureEntries,
} from '../lib/agent-corpus';

export const prerender = false;

const JSONRPC = '2.0';

/** JSON-RPC + A2A error codes. -32001 is A2A TaskNotFound. */
const ERR = {
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internal: -32603,
  taskNotFound: -32001,
} as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      // Browser-based A2A clients are a normal caller here.
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });

const rpcError = (id: unknown, code: number, message: string) =>
  json({ jsonrpc: JSONRPC, id: id ?? null, error: { code, message } });

const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

/** A2A Message object with a single text part. */
function agentMessage(text: string, contextId: string) {
  return {
    kind: 'message',
    role: 'agent',
    messageId: uuid(),
    contextId,
    parts: [{ kind: 'text', text }],
  };
}

/** Concatenate the text parts of an incoming A2A Message. */
function extractText(message: unknown): string {
  if (!message || typeof message !== 'object') return '';
  const parts = (message as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .filter((p): p is { kind?: string; text?: string } => !!p && typeof p === 'object')
    .map((p) => (p.kind === 'text' || p.text ? String(p.text ?? '') : ''))
    .join(' ')
    .trim();
}

/**
 * Route one utterance to a skill. Intent detection is keyword-based on purpose:
 * the corpus is six pages, a dozen ventures and seven FAQs, and anything
 * cleverer would be dressing up a lookup as inference.
 */
function answer(query: string): string {
  const q = query.toLowerCase();

  if (!query) {
    return `Ask about James Tannahill, his ventures, or how to make contact. Skills: site-search, venture-lookup, faq-answer, contact-info. Full corpus: ${corpus.site}/agent-index.json`;
  }

  if (/\b(contact|email|reach|get in touch|hire|enquir|inquir)\b/.test(q)) {
    return [
      `${identity.name} - ${identity.title}`,
      `Contact form: ${identity.contact.form}`,
      `General: ${identity.contact.general}`,
      `Executive profile enquiries: ${identity.contact.profile}`,
      `Executive profile PDF: ${identity.documents.executiveProfilePdf}`,
    ].join('\n');
  }

  if (/\b(venture|portfolio|compan(y|ies)|platform|founded|leads?)\b/.test(q)) {
    const named = ventureEntries.find((v) => q.includes(v.slug) || q.includes(v.name.toLowerCase()));
    if (named) {
      const detail = findVenture(named.slug)!;
      return [
        `${detail.name}`,
        detail.thesis ? `Thesis: ${detail.thesis}` : null,
        detail.description,
        detail.record.length ? `Record: ${detail.record.join(' | ')}` : null,
        `Website: ${detail.website}`,
        detail.page ? `On-site page: ${detail.page}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    }
    return [
      `${ventureEntries.length} ventures and platforms:`,
      ...ventureEntries.map((v) => `- ${v.name} (${v.slug}): ${v.description}`),
    ].join('\n');
  }

  const faqHits = findFaqs(query);
  if (faqHits.length) {
    return faqHits.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
  }

  const results = searchCorpus(query);
  if (results.length) {
    return [
      `${results.length} result(s) for "${query}":`,
      ...results.map((r) => `- [${r.kind}] ${r.title}\n  ${r.url}\n  ${r.snippet}`),
    ].join('\n');
  }

  return [
    `Nothing on this site matches "${query}".`,
    `${identity.name} - ${identity.title}.`,
    identity.summary,
    `Full corpus: ${corpus.site}/agent-index.json`,
  ].join('\n');
}

export const OPTIONS: APIRoute = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });

export const GET: APIRoute = () =>
  json(
    {
      message: 'A2A JSON-RPC endpoint. POST a JSON-RPC 2.0 request with method "message/send".',
      agentCard: identity.documents.agentCard,
      example: {
        jsonrpc: JSONRPC,
        id: 1,
        method: 'message/send',
        params: {
          message: {
            kind: 'message',
            role: 'user',
            messageId: 'client-1',
            parts: [{ kind: 'text', text: 'What ventures does James Tannahill lead?' }],
          },
        },
      },
    },
    200,
  );

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, ERR.parse, 'Parse error: body is not valid JSON.');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return rpcError(null, ERR.invalidRequest, 'Invalid request: expected a JSON-RPC 2.0 object.');
  }

  const { id = null, method, params } = body;
  if (body.jsonrpc !== JSONRPC) {
    return rpcError(id, ERR.invalidRequest, 'Invalid request: "jsonrpc" must be "2.0".');
  }

  switch (method) {
    case 'message/send': {
      const message = params?.message;
      if (!message || typeof message !== 'object') {
        return rpcError(id, ERR.invalidParams, 'Invalid params: "message" is required.');
      }
      const contextId = String(params?.contextId ?? message.contextId ?? uuid());
      try {
        return json({
          jsonrpc: JSONRPC,
          id,
          result: agentMessage(answer(extractText(message)), contextId),
        });
      } catch (err) {
        return rpcError(id, ERR.internal, `Internal error: ${(err as Error).message}`);
      }
    }

    case 'tasks/get':
      return rpcError(
        id,
        ERR.taskNotFound,
        'Task not found: this agent answers synchronously and creates no tasks.',
      );

    default:
      return rpcError(
        id,
        ERR.methodNotFound,
        `Method not found: "${method}". Supported: message/send, tasks/get.`,
      );
  }
};
