import { describe, expect, it } from 'vitest';
import { identity, pages, searchCorpus } from '../../src/lib/agent-corpus';
import { home, contact } from '../../src/data/site-copy';

describe('contact URL', () => {
  it('points the published form at /contact, not /faqs', () => {
    expect(identity.contact.form).toBe('https://jamestannahill.com/contact');
  });

  it('lists /contact in the public page corpus and omits /faqs', () => {
    const paths = pages.map((p) => p.path);
    expect(paths).toContain('/contact');
    expect(paths.some((p) => p.includes('faq'))).toBe(false);
  });

  it('sends FAQ search hits to /contact', () => {
    const hits = searchCorpus('exit multiple');
    const faqHits = hits.filter((h) => h.kind === 'faq');
    expect(faqHits.length).toBeGreaterThan(0);
    for (const hit of faqHits) {
      expect(hit.url).toBe('https://jamestannahill.com/contact');
    }
  });
});

describe('SERP copy', () => {
  it('keeps the homepage H1 line and retitles the document for PE advisory', () => {
    expect(home.h1).toEqual(['Operator.', 'Investor.', 'Builder.']);
    expect(home.title).toBe('James Tannahill — PE Advisory & Value Engineering');
    expect(home.title.length).toBeLessThanOrEqual(60);
    expect(home.description.length).toBeGreaterThanOrEqual(120);
    expect(home.description.length).toBeLessThanOrEqual(160);
    expect(home.subcopy).toMatch(/value engineering/i);
  });

  it('titles the contact page as contact, not FAQs', () => {
    expect(contact.title).toBe('Contact James Tannahill — PE Value Engineering');
    expect(contact.title.length).toBeLessThanOrEqual(60);
    expect(contact.description.length).toBeGreaterThanOrEqual(120);
    expect(contact.description.length).toBeLessThanOrEqual(160);
    expect(contact.canonical).toBe('https://jamestannahill.com/contact');
    expect(contact.formHeading).toBe('Write');
  });
});
