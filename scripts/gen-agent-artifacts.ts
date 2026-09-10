/**
 * Generates the two agent artifacts that must not drift from what the site
 * actually serves, and writes them into public/ before `astro build` runs:
 *
 *  - .well-known/mcp/server-card.json    tool/resource/prompt lists come from
 *                                        src/lib/agent-tools.ts, so adding a
 *                                        tool updates the card automatically
 *  - .well-known/agent-skills/index.json  SHA-256 digest of each SKILL.md, so
 *                                        editing a skill updates its digest
 *
 * Both are generated rather than hand-maintained because both are checkable by
 * a third party: a stale digest is a verifiable lie, and a stale tool list
 * sends clients after tools that are not there.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { agentPrompts, agentResources, agentTools } from '../src/lib/agent-tools';
import { SITE } from '../src/lib/agent-corpus';

const VERSION = '1.0.0';

function write(relPath: string, body: unknown) {
  const out = resolve('public', relPath);
  mkdirSync(resolve(out, '..'), { recursive: true });
  writeFileSync(out, `${JSON.stringify(body, null, 2)}\n`, 'utf-8');
  console.log(`[agent-artifacts] wrote public/${relPath}`);
}

// ── MCP server card (SEP-1649) ──────────────────────────────────────────────
write('.well-known/mcp/server-card.json', {
  $schema: 'https://modelcontextprotocol.io/schemas/draft/server-card.schema.json',
  serverInfo: {
    name: 'jamestannahill-com',
    title: 'James Tannahill Site MCP Server',
    version: VERSION,
    description:
      'Read-only MCP tools over the published content of jamestannahill.com: site search, venture records, FAQ answers and contact details.',
    websiteUrl: SITE,
  },
  protocolVersion: '2025-06-18',
  endpoint: `${SITE}/mcp`,
  transport: {
    type: 'streamable-http',
    endpoint: `${SITE}/mcp`,
  },
  transports: [{ type: 'streamable-http', endpoint: `${SITE}/mcp` }],
  capabilities: {
    tools: { listChanged: false },
    resources: { listChanged: false, subscribe: false },
    prompts: { listChanged: false },
  },
  tools: agentTools.map((t) => ({
    name: t.name,
    title: t.title,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
  resources: agentResources,
  prompts: agentPrompts,
  // Public and unauthenticated; there is nothing here that is not already on
  // the pages, so there is nothing to gate.
  authentication: { type: 'none' },
  documentationUrl: `${SITE}/llms-full.txt`,
});

// ── Agent Skills discovery index (RFC v0.2.0) ───────────────────────────────
interface SkillSource {
  name: string;
  description: string;
  version: string;
}

const skillSources: SkillSource[] = [
  {
    name: 'jamestannahill-site-research',
    description:
      'Research James Tannahill, his ventures, and his professional record using the machine-readable surfaces of jamestannahill.com rather than scraping rendered HTML.',
    version: VERSION,
  },
  {
    name: 'jamestannahill-agent-surfaces',
    description:
      'Connect to the agent endpoints published by jamestannahill.com: MCP over Streamable HTTP, A2A over JSON-RPC, WebMCP in the browser, and the RFC 9727 API catalog.',
    version: VERSION,
  },
];

const skills = skillSources.map((s) => {
  const rel = `skills/${s.name}/SKILL.md`;
  const bytes = readFileSync(resolve('public', rel));
  return {
    name: s.name,
    type: 'skill-md' as const,
    version: s.version,
    description: s.description,
    url: `${SITE}/${rel}`,
    digest: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
    license: 'All rights reserved',
  };
});

write('.well-known/agent-skills/index.json', {
  $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  version: '0.2.0',
  updatedAt: new Date().toISOString().slice(0, 10),
  publisher: {
    name: 'James Tannahill',
    url: SITE,
  },
  skills,
});
