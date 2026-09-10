/**
 * WebMCP tool registration - https://webmachinelearning.github.io/webmcp/
 *
 * Exposes the site's real actions to an in-browser agent: search, venture and
 * FAQ retrieval, contact details, and navigation. The corpus is fetched once
 * from /agent-index.json, which is generated at build time from the same data
 * files the pages render from, so a tool answer and the page agree.
 *
 * Registration is guarded by an AbortController. Every tool is registered with
 * the controller's signal, and abort() also calls unregister() on any handle
 * the browser hands back, since the two mechanisms are at different maturity
 * levels across implementations and either one alone may be a no-op.
 *
 * No-ops silently on browsers without navigator.modelContext.
 */
(() => {
  'use strict';

  if (typeof navigator === 'undefined' || !navigator.modelContext) return;
  if (window.__jtWebMcpReady) return;
  window.__jtWebMcpReady = true;

  const controller = new AbortController();
  const { signal } = controller;
  const handles = [];

  // ── Corpus ────────────────────────────────────────────────────────────────
  let indexPromise = null;
  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch('/agent-index.json', { headers: { Accept: 'application/json' } })
        .then((r) => {
          if (!r.ok) throw new Error(`agent-index.json returned ${r.status}`);
          return r.json();
        })
        .catch((err) => {
          // Let a later call retry rather than caching the failure forever.
          indexPromise = null;
          throw err;
        });
    }
    return indexPromise;
  }

  /** Tool results travel as MCP content blocks. */
  const text = (value) => ({
    content: [
      {
        type: 'text',
        text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      },
    ],
  });

  const norm = (s) => String(s || '').toLowerCase();

  /** Count of query terms present, so a two-word query beats a one-word hit. */
  function score(haystack, terms) {
    const hay = norm(haystack);
    let hits = 0;
    for (const t of terms) if (hay.includes(t)) hits += 1;
    return hits;
  }

  function terms(query) {
    return norm(query)
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2);
  }

  // ── Tools ─────────────────────────────────────────────────────────────────
  const tools = [
    {
      name: 'search_site',
      description:
        "Search jamestannahill.com across pages, ventures and FAQs. Returns ranked matches with their URLs. Use this first when you do not already know which page answers the question.",
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Free-text query, e.g. "private equity valuation levers" or "SigScan".',
          },
          limit: {
            type: 'integer',
            description: 'Maximum results to return.',
            minimum: 1,
            maximum: 25,
            default: 8,
          },
        },
        required: ['query'],
      },
      async execute({ query, limit }) {
        const data = await loadIndex();
        const t = terms(query);
        if (!t.length) return text('Query too short. Use at least one word of three or more characters.');

        const results = [];
        for (const p of data.pages) {
          const s = score(`${p.title} ${p.summary}`, t);
          if (s) results.push({ kind: 'page', title: p.title, url: data.site + p.path, snippet: p.summary, _s: s });
        }
        for (const v of data.ventures) {
          const s = score(`${v.name} ${v.description} ${v.thesis || ''} ${v.record.join(' ')}`, t);
          if (s) {
            results.push({
              kind: 'venture',
              title: v.name,
              url: v.page || v.website,
              snippet: v.thesis || v.description,
              _s: s,
            });
          }
        }
        for (const f of data.faqs) {
          const s = score(`${f.question} ${f.answer}`, t);
          if (s) results.push({ kind: 'faq', title: f.question, url: `${data.site}/faqs/`, snippet: f.answer, _s: s });
        }

        results.sort((a, b) => b._s - a._s);
        const top = results.slice(0, limit || 8).map(({ _s, ...rest }) => rest);
        if (!top.length) return text(`No matches for "${query}".`);
        return text({ query, count: top.length, results: top });
      },
    },

    {
      name: 'list_ventures',
      description:
        "List the ventures and platforms James Tannahill founded, leads or advises, with each one's description, external website and on-site page.",
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      async execute() {
        const data = await loadIndex();
        return text({ count: data.ventures.length, ventures: data.ventures });
      },
    },

    {
      name: 'get_venture',
      description:
        'Retrieve the full record for one venture by its slug. Call list_ventures first if you do not know the slug.',
      inputSchema: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description: 'Venture slug, e.g. "plocamium", "prosec", "rdlb", "sigscan".',
          },
        },
        required: ['slug'],
      },
      async execute({ slug }) {
        const data = await loadIndex();
        const want = norm(slug);
        const v =
          data.ventures.find((x) => norm(x.slug) === want) ||
          data.ventures.find((x) => norm(x.name) === want) ||
          data.ventures.find((x) => norm(x.name).includes(want));
        if (!v) {
          return text(
            `No venture "${slug}". Known slugs: ${data.ventures.map((x) => x.slug).join(', ')}.`,
          );
        }
        return text(v);
      },
    },

    {
      name: 'get_faq_answer',
      description:
        'Answer a pre-engagement question from the published FAQ on value engineering, valuation levers, exit multiples, company fit, applied AI in private equity, and how to make contact.',
      inputSchema: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'The question, in your own words.' },
        },
        required: ['question'],
      },
      async execute({ question }) {
        const data = await loadIndex();
        const t = terms(question);
        const ranked = data.faqs
          .map((f) => ({ ...f, _s: score(`${f.question} ${f.answer}`, t) }))
          .filter((f) => f._s > 0)
          .sort((a, b) => b._s - a._s)
          .slice(0, 3)
          .map(({ _s, ...rest }) => rest);
        if (!ranked.length) {
          return text({
            matched: false,
            message: 'No FAQ covers that. The contact form at /faqs/ reaches James directly.',
            allQuestions: data.faqs.map((f) => f.question),
          });
        }
        return text({ matched: true, answers: ranked, source: `${data.site}/faqs/` });
      },
    },

    {
      name: 'get_contact_info',
      description:
        'Get how to reach James Tannahill: contact form, email addresses, and the machine-readable documents describing him and the site.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      async execute() {
        const data = await loadIndex();
        return text({
          name: data.name,
          title: data.title,
          summary: data.summary,
          contact: data.contact,
          documents: data.documents,
        });
      },
    },

    {
      name: 'navigate_to',
      description:
        'Navigate this browser tab to a page on jamestannahill.com. Use search_site first to find the path. Only same-site paths are accepted.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Site-relative path beginning with "/", e.g. "/faqs/" or "/ventures/plocamium".',
          },
        },
        required: ['path'],
      },
      async execute({ path }) {
        let target;
        try {
          target = new URL(path, window.location.origin);
        } catch {
          return text(`"${path}" is not a valid path.`);
        }
        if (target.origin !== window.location.origin) {
          return text('Refused: navigate_to only moves within jamestannahill.com.');
        }
        window.location.assign(target.href);
        return text(`Navigating to ${target.pathname}${target.search}`);
      },
    },
  ];

  // ── Registration ──────────────────────────────────────────────────────────
  for (const tool of tools) {
    try {
      const handle = navigator.modelContext.registerTool({ ...tool, signal });
      if (handle) handles.push(handle);
    } catch (err) {
      console.warn('[webmcp] registerTool failed for', tool.name, err);
    }
  }

  signal.addEventListener('abort', () => {
    for (const h of handles) {
      try {
        h.unregister?.();
      } catch {
        /* already gone */
      }
    }
    handles.length = 0;
  });

  // Tools describe the whole site, not one route, so they survive ClientRouter
  // swaps and are torn down only when the document itself goes away.
  window.addEventListener('pagehide', () => controller.abort(), { once: true });

  window.__jtWebMcp = { controller, tools: tools.map((t) => t.name) };
})();
