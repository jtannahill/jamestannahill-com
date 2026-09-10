---
name: jamestannahill-agent-surfaces
description: Connect to the agent endpoints published by jamestannahill.com - MCP over Streamable HTTP, A2A over JSON-RPC, WebMCP in the browser, and the RFC 9727 API catalog. Use when wiring this site into an agent runtime or deciding which of its surfaces to call.
license: All rights reserved.
---

# Agent surfaces on jamestannahill.com

Four ways in. They answer from one shared corpus, so pick on transport, not on
expected answer quality.

## Discovery

Every surface is reachable from two documents:

- `GET /.well-known/api-catalog` — RFC 9727 linkset, `application/linkset+json`
- The `Link` header on `/` — `api-catalog`, `service-desc`, `service-doc`,
  `describedby`

Start at one of those rather than hardcoding paths.

## MCP (Streamable HTTP)

Endpoint: `POST https://jamestannahill.com/mcp`
Card: `GET https://jamestannahill.com/.well-known/mcp/server-card.json`

Stateless JSON-RPC 2.0. No session is issued and `GET /mcp` returns 405,
because there are no server-initiated messages and therefore no stream to
resume. Send `initialize`, then `tools/list`, then `tools/call`.

Tools: `search_site`, `list_ventures`, `get_venture`, `get_faq_answer`,
`get_contact_info`. Resources: the corpus and the two `llms` documents.
Prompts: `brief_on_james`, `venture_brief`.

Call `search_site` first when you do not already know which page answers the
question; the other tools assume you know what you are looking for.

## A2A

Endpoint: `POST https://jamestannahill.com/a2a`
Card: `GET https://jamestannahill.com/.well-known/agent-card.json`

JSON-RPC 2.0, `message/send`, one text part in and one text message out.
Stateless, so `tasks/get` always returns `-32001 TaskNotFound` and the card
declares `streaming`, `pushNotifications` and `stateTransitionHistory` all
false. Intent routing is keyword-based over a small corpus; phrase questions
plainly and expect retrieval, not reasoning.

## WebMCP

Loaded on every page. Registers on `navigator.modelContext`: `search_site`,
`list_ventures`, `get_venture`, `get_faq_answer`, `get_contact_info` and
`navigate_to`. `navigate_to` is browser-only and refuses cross-origin targets.
Tools are registered once per document and torn down on `pagehide`.

## Choosing

- Already in a browser tab on the site: WebMCP, and use `navigate_to`.
- An MCP-native runtime: `/mcp`.
- An A2A-native runtime: `/a2a`.
- Neither, and you just want the facts: `GET /agent-index.json` and skip the
  protocols entirely. It is one request and no handshake.

## Limits

All four are read-only. Nothing here transacts, schedules, or sends mail, and
no surface exposes `/thoughts`, which is behind Cloudflare Access.
