import { getCollection, type CollectionEntry } from 'astro:content';

export type Edition = CollectionEntry<'newsletter'>;

/** URL slug for an edition: its `slug` field if set, else the filename without its YYYY-MM-DD- prefix. */
export function editionSlug(edition: Edition): string {
  return edition.data.slug ?? edition.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

export function editionUrl(edition: Edition): string {
  return `/newsletter/${editionSlug(edition)}`;
}

/** Published editions, newest first. Drafts are hidden in production builds only. */
export async function getEditions(): Promise<Edition[]> {
  const editions = await getCollection('newsletter', ({ data }) => import.meta.env.DEV || !data.draft);
  return editions.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Excerpt from frontmatter, falling back to the first ~160 chars of the body. */
export function editionExcerpt(edition: Edition, max = 160): string {
  if (edition.data.excerpt) return edition.data.excerpt;
  const text = (edition.body ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}
