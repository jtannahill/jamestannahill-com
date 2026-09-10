/**
 * Publishes the DNS-AID discovery records for jamestannahill.com.
 *
 * Requires a Cloudflare API token with Zone:DNS:Edit on zone
 * jamestannahill.com. The stored Access token cannot do this, and wrangler's
 * OAuth session only carries zone:read, so this needs its own token:
 *
 *   CF_DNS_TOKEN=... node scripts/dns-aid-apply.mjs           # dry run
 *   CF_DNS_TOKEN=... node scripts/dns-aid-apply.mjs --apply   # write records
 *
 * Idempotent: an existing record at the same name is updated in place rather
 * than duplicated.
 *
 * SvcParamKeys 65280+ are the private-use range, which is where experimental
 * DNS-AID parameters belong until they are registered with IANA:
 *   key65280  path of the endpoint on the target host
 *   key65281  discovery document describing the endpoint
 */
const ZONE_ID = '46d27abeb6b6fded2520533bfedccc2e';
const API = 'https://api.cloudflare.com/client/v4';
const TOKEN = process.env.CF_DNS_TOKEN;
const APPLY = process.argv.includes('--apply');

/** ServiceMode (priority >= 1) SVCB records under the _agents namespace. */
const RECORDS = [
  {
    name: '_index._agents.jamestannahill.com',
    comment: 'DNS-AID: entrypoint, points at the RFC 9727 API catalog',
    data: {
      priority: 1,
      target: 'jamestannahill.com.',
      value:
        'alpn="h2,http/1.1" port=443 key65280="/.well-known/api-catalog" key65281="/.well-known/api-catalog"',
    },
  },
  {
    name: '_a2a._agents.jamestannahill.com',
    comment: 'DNS-AID: A2A JSON-RPC agent endpoint',
    data: {
      priority: 1,
      target: 'jamestannahill.com.',
      value:
        'mandatory="alpn,port" alpn="a2a,h2" port=443 key65280="/a2a" key65281="/.well-known/agent-card.json"',
    },
  },
  {
    name: '_mcp._agents.jamestannahill.com',
    comment: 'DNS-AID: MCP Streamable HTTP endpoint',
    data: {
      priority: 1,
      target: 'jamestannahill.com.',
      value:
        'mandatory="alpn,port" alpn="mcp,h2" port=443 key65280="/mcp" key65281="/.well-known/mcp/server-card.json"',
    },
  },
  {
    name: '_skills._agents.jamestannahill.com',
    comment: 'DNS-AID: Agent Skills discovery index',
    data: {
      priority: 1,
      target: 'jamestannahill.com.',
      value:
        'alpn="h2,http/1.1" port=443 key65280="/.well-known/agent-skills/index.json" key65281="/.well-known/agent-skills/index.json"',
    },
  },
];

if (!TOKEN) {
  console.error('Set CF_DNS_TOKEN to a Cloudflare token with Zone:DNS:Edit on jamestannahill.com.');
  process.exit(1);
}

const cf = async (path, init = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json();
  if (!body.success) {
    throw new Error(`${init.method ?? 'GET'} ${path}: ${JSON.stringify(body.errors)}`);
  }
  return body.result;
};

const existing = await cf(`/zones/${ZONE_ID}/dns_records?type=SVCB&per_page=100`);
const byName = new Map(existing.map((r) => [r.name, r]));

for (const rec of RECORDS) {
  const payload = { type: 'SVCB', name: rec.name, data: rec.data, ttl: 3600, comment: rec.comment };
  const prior = byName.get(rec.name);
  const verb = prior ? 'update' : 'create';

  if (!APPLY) {
    console.log(`[dry-run] ${verb} SVCB ${rec.name}`);
    console.log(`          ${rec.data.priority} ${rec.data.target} ${rec.data.value}`);
    continue;
  }

  await cf(
    prior ? `/zones/${ZONE_ID}/dns_records/${prior.id}` : `/zones/${ZONE_ID}/dns_records`,
    { method: prior ? 'PUT' : 'POST', body: JSON.stringify(payload) },
  );
  console.log(`${verb}d SVCB ${rec.name}`);
}

// DNSSEC is required for validating resolvers to return authenticated data.
const dnssec = await cf(`/zones/${ZONE_ID}/dnssec`);
console.log(`\nDNSSEC status: ${dnssec.status}`);
if (dnssec.status !== 'active') {
  console.log(
    'DNSSEC is not active. Enable it on the zone, then add the DS record at the registrar;\n' +
      'until the DS is published the chain of trust is incomplete.',
  );
  if (dnssec.ds) console.log(`DS record to publish at the registrar:\n  ${dnssec.ds}`);
}
