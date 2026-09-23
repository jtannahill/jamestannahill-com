/** Homepage and contact document copy. Pages import from here so titles and
 *  the hero line cannot drift from what the audit specified. */
export const home = {
  title: 'James Tannahill — SpaceXAI & PE Value Engineering',
  description:
    'Operator-led private equity advisory for founder-led companies. Value engineering, exit preparation, and applied AI. Intelligent Capital at SpaceXAI. New York.',
  h1: ['Operator.', 'Investor.', 'Builder.'] as const,
  subcopy:
    'Intelligent Capital at SpaceXAI. Former President & Managing Partner, Plocamium Holdings. Private equity advisory and value engineering for founder-led companies.',
};

export const contact = {
  title: 'Contact James Tannahill — PE Value Engineering',
  description:
    'Confidential inquiries for founder-led and PE-backed companies, $5M–$100M, 12–36 months from transaction. New York and worldwide.',
  canonical: 'https://jamestannahill.com/contact',
  formHeading: 'Send a message',
};

export const person = {
  subjectOfUrl: 'https://jamestannahill.com/',
  jobTitle:
    'Intelligent Capital, SpaceXAI (xAI); Head of Field Operations, ProSecPR; former President & Managing Partner, Plocamium Holdings',
};

/** Cache-buster for social scrapers. Bump when replacing the named PNG. */
export const og = {
  home: 'https://jamestannahill.com/og.png?v=3',
  contact: 'https://jamestannahill.com/og-contact.png?v=1',
  thoughts: 'https://jamestannahill.com/og-thoughts.png?v=4',
  profile: 'https://jamestannahill.com/og-profile.png?v=2',
  venture: (slug: string) => `https://jamestannahill.com/og-venture-${slug}.png?v=2`,
};
