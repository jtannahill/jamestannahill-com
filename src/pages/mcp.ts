/**
 * MCP server over Streamable HTTP - https://modelcontextprotocol.io
 *
 * JSON-RPC 2.0 on POST. Stateless: no session is created, so there is no SSE
 * stream to resume and GET returns 405, which the spec allows for servers that
 * do not offer server-initiated messages.
 *
 * Implements: initialize, ping, tools/list, tools/call, resources/list,
 * resources/read, prompts/list, prompts/get. Tools and resources come from
 * src/lib/agent-tools.ts, over the corpus in src/lib/agent-corpus.ts.
 *
 * Everything here is read-only. The server card at
 * /.well-known/mcp/server-card.json describes exactly this surface.
 */
import type { APIRoute } from 'astro';
import { corpus } from '../lib/agent-corpus';
import { agentPrompts, agentResources, agentTools, renderPrompt } from '../lib/agent-tools';

export const prerender = false;

const JSONRPC = '2.0';
/** Latest spec revision this server was written against. */
const PROTOCOL_VERSION = '2025-06-18';

const ERR = {
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internal: -32603,
} as const;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Mcp-Session-Id, MCP-Protocol-Version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });

const rpcError = (id: unknown, code: number, message: string) =>
  json({ jsonrpc: JSONRPC, id: id ?? null, error: { code, message } });

const result = (id: unknown, value: unknown) => json({ jsonrpc: JSONRPC, id, result: value });

/** MCP tool results carry content blocks; isError reports tool-level failure. */
const toolText = (text: string, isError = false) => ({
  content: [{ type: 'text', text }],
  isError,
});

function handle(body: any): Response | null {
  const { id = null, method, params } = body;

  switch (method) {
    case 'initialize':
      return result(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false, subscribe: false },
          prompts: { listChanged: false },
        },
        serverInfo: {
          name: 'jamestannahill-com',
          title: 'James Tannahill Site MCP Server',
          version: '1.0.0',
        },
        instructions:
          'Read-only tools over the published content of jamestannahill.com. Call search_site first if you do not know which page answers the question.',
      });

    case 'ping':
      return result(id, {});

    case 'tools/list':
      return result(id, {
        tools: agentTools.map((t) => ({
          name: t.name,
          title: t.title,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });

    case 'tools/call': {
      const name = params?.name;
      const tool = agentTools.find((t) => t.name === name);
      if (!tool) {
        return result(
          id,
          toolText(
            `Unknown tool "${name}". Available: ${agentTools.map((t) => t.name).join(', ')}.`,
            true,
          ),
        );
      }
      try {
        return result(id, toolText(tool.run(params?.arguments ?? {})));
      } catch (err) {
        return result(id, toolText(`Tool failed: ${(err as Error).message}`, true));
      }
    }

    case 'resources/list':
      return result(id, { resources: agentResources });

    case 'resources/read': {
      const uri = String(params?.uri ?? '');
      const res = agentResources.find((r) => r.uri === uri);
      if (!res) {
        return rpcError(
          id,
          ERR.invalidParams,
          `Unknown resource "${uri}". Available: ${agentResources.map((r) => r.uri).join(', ')}.`,
        );
      }
      // The corpus is in memory; the two text documents are static assets, so
      // point the client at them rather than proxying our own origin.
      if (res.name === 'agent-index') {
        return result(id, {
          contents: [{ uri, mimeType: res.mimeType, text: JSON.stringify(corpus, null, 2) }],
        });
      }
      return result(id, {
        contents: [
          {
            uri,
            mimeType: res.mimeType,
            text: `Fetch this document directly over HTTPS: ${uri}`,
          },
        ],
      });
    }

    case 'prompts/list':
      return result(id, { prompts: agentPrompts });

    case 'prompts/get': {
      const name = String(params?.name ?? '');
      const text = renderPrompt(name, params?.arguments ?? {});
      if (text === null) {
        return rpcError(
          id,
          ERR.invalidParams,
          `Unknown prompt "${name}" or missing argument. Available: ${agentPrompts
            .map((p) => p.name)
            .join(', ')}.`,
        );
      }
      const prompt = agentPrompts.find((p) => p.name === name);
      return result(id, {
        description: prompt?.description,
        messages: [{ role: 'user', content: { type: 'text', text } }],
      });
    }

    default:
      // Notifications carry no id and expect no response.
      if (typeof method === 'string' && method.startsWith('notifications/')) return null;
      return rpcError(id, ERR.methodNotFound, `Method not found: "${method}".`);
  }
}

export const OPTIONS: APIRoute = () =>
  new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Max-Age': '86400' } });

/** No server-initiated messages, so there is no stream to open. */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      error: 'Method Not Allowed',
      message:
        'This MCP server is stateless and offers no SSE stream. POST JSON-RPC 2.0 requests here.',
      serverCard: `${corpus.site}/.well-known/mcp/server-card.json`,
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'POST, OPTIONS', ...CORS },
    },
  );

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, ERR.parse, 'Parse error: body is not valid JSON.');
  }

  // A batch is a JSON array of requests; notifications inside it drop out.
  if (Array.isArray(body)) {
    const responses: unknown[] = [];
    for (const entry of body) {
      if (!entry || typeof entry !== 'object' || entry.jsonrpc !== JSONRPC) {
        responses.push({
          jsonrpc: JSONRPC,
          id: entry?.id ?? null,
          error: { code: ERR.invalidRequest, message: 'Invalid request.' },
        });
        continue;
      }
      const res = handle(entry);
      if (res) responses.push(await res.json());
    }
    return responses.length ? json(responses) : new Response(null, { status: 202, headers: CORS });
  }

  if (!body || typeof body !== 'object') {
    return rpcError(null, ERR.invalidRequest, 'Invalid request: expected a JSON-RPC 2.0 object.');
  }
  if (body.jsonrpc !== JSONRPC) {
    return rpcError(body.id ?? null, ERR.invalidRequest, 'Invalid request: "jsonrpc" must be "2.0".');
  }

  const res = handle(body);
  // A notification gets an empty 202, per the Streamable HTTP transport.
  return res ?? new Response(null, { status: 202, headers: CORS });
};
