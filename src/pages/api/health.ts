// Server-rendered endpoint: required so Astro recognises at least one
// non-prerendered project route, which allows Astro Actions to function
// (ActionsWithoutServerOutputError guard in astro/dist/actions/integration.js).
import type { APIRoute } from 'astro';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
