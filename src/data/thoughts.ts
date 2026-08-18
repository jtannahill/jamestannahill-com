// Single source of truth for the /thoughts index and the per-essay chrome
// (reading time, prev/next, share). Newest first. The first entry runs as the
// lead plate on the index. `art` is the same artwork that opens the essay
// itself, so the index and the piece agree visually.

export interface Post {
  slug: string;
  title: string;
  standfirst: string;
  date: string;
  published: string;
  art: string;
  artAlt: string;
  aspect: string;
}

export const posts: Post[] = [
  {
    slug: 'a-skull-from-georgia',
    title: 'A Skull from Georgia',
    standfirst: 'On the one category defined by what it is not, and the relic bolted to the front of it',
    date: 'August 2026',
    published: '2026-08-13',
    art: 'https://art.jamestannahill.com/weather/2026-08-12-060044/region-30n-60w/preview-1200.webp',
    artAlt: 'Hard-edged abstract painting of overlapping circles in red, orange, blue, yellow and black crossed by fine ruled lines on a cream ground',
    aspect: '4 / 3',
  },
  {
    slug: 'decline-to-self-identify',
    title: 'Decline to Self-Identify',
    standfirst: 'On the questionnaire that invents the person it counts, and the one box on it that cannot',
    date: 'August 2026',
    published: '2026-08-06',
    art: 'https://art.jamestannahill.com/weather/2026-08-06-060044/tropical-south-america-15s-70w/preview-1200.webp',
    artAlt: 'Abstract painting of a luminous pale knot caught in a wide web of fine lines across a dark blue ground',
    aspect: '4 / 3',
  },
  {
    slug: 'tenure-without-persons',
    title: 'Tenure Without Persons',
    standfirst: 'On what actually becomes permanent inside an institution, and the accession number that answers a polemic',
    date: 'August 2026',
    published: '2026-08-05',
    art: 'https://art.jamestannahill.com/weather/2026-08-05-060044/tropical-south-america-15s-70w/preview-1200.webp',
    artAlt: 'Two panel abstract painting of a dense green and yellow canopy with a pale seam running down the center',
    aspect: '4 / 3',
  },
  {
    slug: 'nothing-to-photograph',
    title: 'Nothing to Photograph',
    standfirst: 'On why firms automate the step they should have deleted, and the committee that makes it inevitable',
    date: 'August 2026',
    published: '2026-08-05',
    art: 'https://art.jamestannahill.com/weather/2026-08-05-060044/europe-45n-30w/preview-1200.webp',
    artAlt: 'Abstract painting of dense green, yellow and blue dabs massed across a pale ground like a canopy seen from above',
    aspect: '4 / 3',
  },
  {
    slug: 'whose-egg-is-that',
    title: 'Whose Egg Is That',
    standfirst: 'On abolishing the hiring layer, and returning the decision to the people who have to live with it',
    date: 'August 2026',
    published: '2026-08-05',
    art: 'https://art.jamestannahill.com/weather/2026-08-04-060044/south-america-60s-60w/preview-1200.webp',
    artAlt: 'Abstract painting of pink, black, yellow and coral strokes stacked across a pale ground',
    aspect: '16 / 9',
  },
  {
    slug: 'the-org-chart-travels',
    title: 'The Org Chart Travels',
    standfirst: 'On what actually crosses a border when an idea is exported, and why the argument stays home',
    date: 'August 2026',
    published: '2026-08-04',
    art: 'https://art.jamestannahill.com/weather/2026-08-04-193850/western-pacific-15n-160e/preview-1200.webp',
    artAlt: 'Psychedelic poster painting of Earth blazing at the centre of a starburst of neon rainbow rays',
    aspect: '4 / 3',
  },
  {
    slug: 'inventors-of-problems',
    title: 'Inventors of Problems',
    standfirst: 'On the staff function that must manufacture demand, and the executives who pay it to do so',
    date: 'August 2026',
    published: '2026-08-04',
    art: 'https://art.jamestannahill.com/weather/2026-08-03-212941/central-asia-45n-90e/preview-1200.webp',
    artAlt: 'Painting of four dense splatter bursts in yellow, red, green and blue radiating across white',
    aspect: '4 / 3',
  },
  {
    slug: 'ask-who-the-party-secretary-is',
    title: 'Ask Who the Party Secretary Is',
    standfirst: 'On dealing with an adversary that files its intentions publicly, and the diligence question nobody wants to ask first',
    date: 'August 2026',
    published: '2026-08-04',
    art: 'https://art.jamestannahill.com/weather/2026-08-01-060044/region-60s-0e/preview-1200.webp',
    artAlt: 'Hard-edged abstract painting of circles and rectangles in red, yellow and blue on white, cut by black diagonals',
    aspect: '4 / 3',
  },
  {
    slug: 'sea-room',
    title: 'Sea Room',
    standfirst: 'On the difference between knowing where you are and having somewhere to go',
    date: 'August 2026',
    published: '2026-08-04',
    art: 'https://art.jamestannahill.com/weather/2026-08-03-060044/tropical-south-america-15s-70w/preview-1200.webp',
    artAlt: 'Abstract painting of stacked biomorphic shapes in yellow, blue and red on a peach ground',
    aspect: '4 / 3',
  },
  {
    slug: 'the-unsmiling-class',
    title: 'The Unsmiling Class',
    standfirst: 'On the finance headshot, and the face it has agreed to wear',
    date: 'August 2026',
    published: '2026-08-04',
    art: 'https://art.jamestannahill.com/weather/2026-08-03-060044/north-america-45n-120w/preview-1200.webp',
    artAlt: 'Abstract painting of soft-edged sprayed forms in red, yellow and navy on a tan ground',
    aspect: '4 / 3',
  },
  {
    slug: 'guerir-quelquefois',
    title: 'Guérir Quelquefois',
    standfirst: 'On the word "cure," and the men who sell it',
    date: 'August 2026',
    published: '2026-08-04',
    art: 'https://art.jamestannahill.com/weather/2026-08-02-060044/central-asia-45n-90e/preview-1200.webp',
    artAlt: 'Abstract painting of overlapping pale rounded shapes in grey, cream and rose',
    aspect: '4 / 3',
  },
];

// Word counts come from the essay sources at build time, so reading time never
// drifts from the text. Astro pages are globbed raw and stripped of markup,
// frontmatter and scripts before counting.
const raw = import.meta.glob('../pages/thoughts/*.astro', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function countWords(source: string): number {
  const body = source.replace(/^---[\s\S]*?---/, '');
  const noScript = body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  const noTags = noScript.replace(/<[^>]+>/g, ' ').replace(/\{[^}]*\}/g, ' ');
  return noTags.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

const wordsBySlug: Record<string, number> = {};
for (const [path, source] of Object.entries(raw)) {
  const slug = path.split('/').pop()!.replace(/\.astro$/, '');
  if (slug === 'index') continue;
  wordsBySlug[slug] = countWords(source);
}

export function readingMinutes(slug: string): number {
  const words = wordsBySlug[slug] ?? 0;
  return Math.max(1, Math.round(words / 230));
}

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

/** Older = next in reading order (further down the index); newer = the one above it. */
export function neighbors(slug: string): { newer?: Post; older?: Post } {
  const i = posts.findIndex((p) => p.slug === slug);
  if (i < 0) return {};
  return { newer: posts[i - 1], older: posts[i + 1] };
}
