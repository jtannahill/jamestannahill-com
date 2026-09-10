/**
 * The whole corpus in one request, for agents that would rather fetch once than
 * call tools. Content lives in src/lib/agent-corpus.ts, shared with /a2a and
 * the WebMCP tools in public/scripts/webmcp.js.
 */
import type { APIRoute } from 'astro';
import { corpus } from '../lib/agent-corpus';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(corpus, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
