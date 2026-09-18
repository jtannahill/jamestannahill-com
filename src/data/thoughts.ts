// Index chrome and reading time. Post records live in thoughts-posts.ts so
// Node (gen-agent-artifacts) can import the list without Vite's import.meta.glob.
export type { Post } from './thoughts-posts';
export { posts } from './thoughts-posts';
import { posts, type Post } from './thoughts-posts';

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
