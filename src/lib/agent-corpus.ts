/**
 * The site as data, built at compile time from the same files the pages render
 * from. Shared by three surfaces so they cannot drift apart:
 *
 *  - /agent-index.json      the whole corpus in one request
 *  - /a2a                   the A2A JSON-RPC agent endpoint
 *  - /scripts/webmcp.js     in-browser WebMCP tools (fetches agent-index.json)
 *
 * `/thoughts` is deliberately excluded: it sits behind Cloudflare Access, so
 * advertising those URLs would hand an agent links it cannot fetch.
 */
import { ventures } from '../data/ventures';
import { faqs } from '../data/faqs';

export const SITE = 'https://jamestannahill.com';

export interface SitePage {
  path: string;
  title: string;
  summary: string;
}

export const pages: SitePage[] = [
  {
    path: '/',
    title: 'Home',
    summary:
      'Professional overview for James Tannahill: operator, investor, and multi-venture founder. Bio, active systems, operating partnerships, competencies, and the venture portfolio.',
  },
  {
    path: '/profile',
    title: 'Executive Profile',
    summary:
      'One-page executive profile with a downloadable PDF at /profile.pdf. Contact for profile enquiries: profile@jamestannahill.com.',
  },
  {
    path: '/faqs/',
    title: 'Get in Touch',
    summary:
      'Contact form plus pre-engagement questions on value engineering, valuation levers, exit multiples, company fit, and applied AI in private equity.',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    summary: 'How the site handles visitor data, analytics, and contact-form submissions.',
  },
  { path: '/terms', title: 'Terms', summary: 'Terms governing use of the site.' },
  {
    path: '/accessibility',
    title: 'Accessibility',
    summary: 'Accessibility commitments and conformance for the site.',
  },
];

export const ventureEntries = ventures.map((v) => ({
  name: v.name,
  slug: v.slug,
  description: v.description,
  website: v.url,
  page: v.page ? `${SITE}/ventures/${v.slug}` : null,
  thesis: v.page?.thesis ?? null,
  record: v.page?.record ?? [],
}));

export const faqEntries = faqs.map(({ q, a }) => ({ question: q, answer: a }));

export const identity = {
  name: 'James Tannahill',
  title: 'President & Managing Partner, Plocamium Holdings',
  summary:
    'James Tannahill is a New York City-based private equity operator, investor, and multi-venture founder. President & Managing Partner of Plocamium Holdings, an operator-led private equity platform deploying patient capital across industrial technologies and healthcare. Intelligent Capital at xAI. Co-Founder of 1ness Strategies, Advisor to RDLB, and Head of Field Operations at ProSecPR.',
  contact: {
    general: 'web@jamestannahill.com',
    profile: 'profile@jamestannahill.com',
    form: `${SITE}/faqs/`,
  },
  documents: {
    llms: `${SITE}/llms.txt`,
    llmsFull: `${SITE}/llms-full.txt`,
    apiCatalog: `${SITE}/.well-known/api-catalog`,
    openapi: `${SITE}/openapi.json`,
    agentCard: `${SITE}/.well-known/agent-card.json`,
    sitemap: `${SITE}/sitemap-index.xml`,
    executiveProfilePdf: `${SITE}/profile.pdf`,
  },
};

export const corpus = {
  site: SITE,
  ...identity,
  pages,
  ventures: ventureEntries,
  faqs: faqEntries,
};

// ── Retrieval ───────────────────────────────────────────────────────────────

const norm = (s: unknown) => String(s ?? '').toLowerCase();

/** Query terms of three or more characters; shorter words match everything. */
export function terms(query: string): string[] {
  return norm(query)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

/** Count of distinct query terms present, so a two-word query outranks a one-word hit. */
export function score(haystack: string, t: string[]): number {
  const hay = norm(haystack);
  let hits = 0;
  for (const term of t) if (hay.includes(term)) hits += 1;
  return hits;
}

export interface SearchResult {
  kind: 'page' | 'venture' | 'faq';
  title: string;
  url: string;
  snippet: string;
}

export function searchCorpus(query: string, limit = 8): SearchResult[] {
  const t = terms(query);
  if (!t.length) return [];
  const scored: (SearchResult & { _s: number })[] = [];

  for (const p of pages) {
    const s = score(`${p.title} ${p.summary}`, t);
    if (s) scored.push({ kind: 'page', title: p.title, url: SITE + p.path, snippet: p.summary, _s: s });
  }
  for (const v of ventureEntries) {
    const s = score(`${v.name} ${v.description} ${v.thesis ?? ''} ${v.record.join(' ')}`, t);
    if (s) {
      scored.push({
        kind: 'venture',
        title: v.name,
        url: v.page ?? v.website,
        snippet: v.thesis ?? v.description,
        _s: s,
      });
    }
  }
  for (const f of faqEntries) {
    const s = score(`${f.question} ${f.answer}`, t);
    if (s) scored.push({ kind: 'faq', title: f.question, url: `${SITE}/faqs/`, snippet: f.answer, _s: s });
  }

  scored.sort((a, b) => b._s - a._s);
  return scored.slice(0, limit).map(({ _s, ...rest }) => rest);
}

export function findVenture(slug: string) {
  const want = norm(slug);
  return (
    ventureEntries.find((v) => norm(v.slug) === want) ??
    ventureEntries.find((v) => norm(v.name) === want) ??
    ventureEntries.find((v) => norm(v.name).includes(want)) ??
    null
  );
}

export function findFaqs(question: string, limit = 3) {
  const t = terms(question);
  return faqEntries
    .map((f) => ({ ...f, _s: score(`${f.question} ${f.answer}`, t) }))
    .filter((f) => f._s > 0)
    .sort((a, b) => b._s - a._s)
    .slice(0, limit)
    .map(({ _s, ...rest }) => rest);
}
