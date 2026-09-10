/**
 * Tool definitions shared by the server-side MCP endpoint (src/pages/mcp.ts).
 *
 * These mirror the browser tools in public/scripts/webmcp.js, minus
 * `navigate_to`, which only means something inside a page. The two lists are
 * deliberately separate implementations - one runs in a browser tab, one in the
 * Worker - but both answer from src/lib/agent-corpus.ts, so a given question
 * gets the same answer either way. Keep them in step when adding a tool.
 */
import {
  corpus,
  faqEntries,
  findFaqs,
  findVenture,
  identity,
  searchCorpus,
  ventureEntries,
} from './agent-corpus';

export interface AgentTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** Returns the text body of the tool result. */
  run: (args: Record<string, any>) => string;
}

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

export const agentTools: AgentTool[] = [
  {
    name: 'search_site',
    title: 'Search the site',
    description:
      'Search jamestannahill.com across pages, ventures and FAQs. Returns ranked matches with their URLs. Use this first when you do not already know which page answers the question.',
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
    run: ({ query, limit }) => {
      const results = searchCorpus(String(query ?? ''), Number(limit) || 8);
      if (!results.length) return `No matches for "${query}".`;
      return pretty({ query, count: results.length, results });
    },
  },

  {
    name: 'list_ventures',
    title: 'List ventures',
    description:
      "List the ventures and platforms James Tannahill founded, leads or advises, with each one's description, external website and on-site page.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: () => pretty({ count: ventureEntries.length, ventures: ventureEntries }),
  },

  {
    name: 'get_venture',
    title: 'Get one venture',
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
    run: ({ slug }) => {
      const v = findVenture(String(slug ?? ''));
      if (!v) {
        return `No venture "${slug}". Known slugs: ${ventureEntries.map((x) => x.slug).join(', ')}.`;
      }
      return pretty(v);
    },
  },

  {
    name: 'get_faq_answer',
    title: 'Answer a pre-engagement question',
    description:
      'Answer a pre-engagement question from the published FAQ on value engineering, valuation levers, exit multiples, company fit, applied AI in private equity, and how to make contact.',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question, in your own words.' },
      },
      required: ['question'],
    },
    run: ({ question }) => {
      const hits = findFaqs(String(question ?? ''));
      if (!hits.length) {
        return pretty({
          matched: false,
          message: 'No FAQ covers that. The contact form at /faqs/ reaches James directly.',
          allQuestions: faqEntries.map((f) => f.question),
        });
      }
      return pretty({ matched: true, answers: hits, source: `${corpus.site}/faqs/` });
    },
  },

  {
    name: 'get_contact_info',
    title: 'Get contact details',
    description:
      'Get how to reach James Tannahill: contact form, email addresses, and the machine-readable documents describing him and the site.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: () =>
      pretty({
        name: identity.name,
        title: identity.title,
        summary: identity.summary,
        contact: identity.contact,
        documents: identity.documents,
      }),
  },
];

/** MCP resources: whole documents an agent may prefer to read directly. */
export const agentResources = [
  {
    uri: `${corpus.site}/agent-index.json`,
    name: 'agent-index',
    title: 'Site corpus',
    description: 'Every page, venture and FAQ on jamestannahill.com as one JSON document.',
    mimeType: 'application/json',
  },
  {
    uri: `${corpus.site}/llms.txt`,
    name: 'llms-txt',
    title: 'LLM guidance index',
    description: 'Short-form site index written for language models.',
    mimeType: 'text/plain',
  },
  {
    uri: `${corpus.site}/llms-full.txt`,
    name: 'llms-full-txt',
    title: 'Full LLM guidance',
    description: 'Entity data, citable facts, professional background and access policy.',
    mimeType: 'text/plain',
  },
];

export const agentPrompts = [
  {
    name: 'brief_on_james',
    title: 'Brief me on James Tannahill',
    description: 'A short, sourced briefing on who James Tannahill is and what he runs.',
    arguments: [],
  },
  {
    name: 'venture_brief',
    title: 'Brief on one venture',
    description: 'A short briefing on a single venture, drawn from its published page.',
    arguments: [
      { name: 'slug', description: 'Venture slug, e.g. "plocamium".', required: true },
    ],
  },
];

export function renderPrompt(name: string, args: Record<string, any> = {}): string | null {
  switch (name) {
    case 'brief_on_james':
      return [
        `Summarise the following for a reader who has never heard of him. Be factual and do not embellish.`,
        '',
        `${identity.name} - ${identity.title}`,
        identity.summary,
        '',
        `Ventures: ${ventureEntries.map((v) => v.name).join(', ')}.`,
        `Sources: ${corpus.site}/llms-full.txt and ${corpus.site}/agent-index.json`,
      ].join('\n');
    case 'venture_brief': {
      const v = findVenture(String(args.slug ?? ''));
      if (!v) return null;
      return [
        `Summarise this venture in three sentences for an investor audience. Use only what is given.`,
        '',
        `Name: ${v.name}`,
        v.thesis ? `Thesis: ${v.thesis}` : '',
        `Description: ${v.description}`,
        v.record.length ? `Record: ${v.record.join(' | ')}` : '',
        `Website: ${v.website}`,
      ]
        .filter(Boolean)
        .join('\n');
    }
    default:
      return null;
  }
}
