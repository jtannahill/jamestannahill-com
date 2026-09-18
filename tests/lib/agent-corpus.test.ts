import { describe, expect, it } from 'vitest';
import { identity, pages, searchCorpus } from '../../src/lib/agent-corpus';
import { home, contact, person } from '../../src/data/site-copy';
import { venturePages } from '../../src/data/ventures';

describe('contact URL', () => {
  it('points the published form at /contact, not /faqs', () => {
    expect(identity.contact.form).toBe('https://jamestannahill.com/contact');
  });

  it('publishes contact@ as the general address', () => {
    expect(identity.contact.general).toBe('contact@jamestannahill.com');
    expect(identity.contact.profile).toBe('profile@jamestannahill.com');
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
    expect(home.title).toBe('James Tannahill — SpaceXAI & PE Value Engineering');
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

describe('venture document titles', () => {
  it('gives every venture page a topic-specific title under 60 characters', () => {
    expect(venturePages.length).toBeGreaterThanOrEqual(8);
    for (const v of venturePages) {
      const title = v.page!.metaTitle;
      expect(title.length, `${v.slug} title too long: ${title}`).toBeLessThanOrEqual(60);
      expect(title.endsWith('- James Tannahill'), `${v.slug} still uses the generic suffix`).toBe(false);
      expect(title.toLowerCase()).toContain(v.name.split(' ')[0].toLowerCase().replace(/\.$/, ''));
    }
  });

  it('titles Plocamium for patient capital, not just the brand name', () => {
    const p = venturePages.find((v) => v.slug === 'plocamium')!;
    expect(p.page!.metaTitle).toBe('Plocamium Holdings — Patient Capital, Industry & Healthcare');
  });
});

describe('Person schema', () => {
  it('points subjectOf at the indexable homepage, not the noindex profile', () => {
    expect(person.subjectOfUrl).toBe('https://jamestannahill.com/');
  });

  it('leads the job title with SpaceXAI and marks Plocamium as former', () => {
    expect(person.jobTitle).toMatch(/SpaceXAI/);
    expect(person.jobTitle).toMatch(/former President & Managing Partner, Plocamium Holdings/);
  });
});

describe('public essays', () => {
  it('lists /thoughts in the public page corpus', () => {
    expect(pages.map((p) => p.path)).toContain('/thoughts');
  });

  it('returns essay hits for a published title', () => {
    const hits = searchCorpus('skin in the game');
    expect(hits.some((h) => h.kind === 'essay' && h.url.includes('/thoughts/skin-in-the-game'))).toBe(true);
  });
});
