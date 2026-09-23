import { describe, expect, it } from 'vitest';
import { POST } from '../../src/pages/mcp';

const entry = {
  jsonrpc: '2.0',
  id: 1,
  method: 'resources/read',
  params: { uri: 'https://jamestannahill.com/agent-index.json' },
};

const call = async (body: string) => {
  const res = await (POST as any)({
    request: new Request('http://local/mcp', { method: 'POST', body }),
  });
  return res.json();
};

describe('POST /mcp limits', () => {
  it('answers a small batch', async () => {
    const out = await call(JSON.stringify([entry, { ...entry, id: 2 }]));
    expect(Array.isArray(out)).toBe(true);
    expect(out).toHaveLength(2);
  });

  it('rejects a batch over the entry cap', async () => {
    const out = await call(JSON.stringify(Array(21).fill(entry)));
    expect(out.error.code).toBe(-32600);
    expect(out.error.message).toContain('batch exceeds');
  });

  it('rejects a body over the byte cap', async () => {
    const out = await call(JSON.stringify({ ...entry, pad: 'x'.repeat(70 * 1024) }));
    expect(out.error.code).toBe(-32600);
    expect(out.error.message).toContain('body exceeds');
  });
});
