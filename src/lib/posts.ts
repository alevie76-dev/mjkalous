import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** URL slug for a post: the filename without its YYYY-MM-DD- prefix. */
export function postSlug(post: Post): string {
  return post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

export function postUrl(post: Post): string {
  return `/blog/${postSlug(post)}`;
}

export function categorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Published posts, newest first. Drafts are hidden in production builds only. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Categories that actually have posts, with counts, in first-seen order. */
export function categoriesWithCounts(posts: Post[]): { name: string; slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const c of post.data.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => ({ name, slug: categorySlug(name), count }));
}

export function formatDate(date: Date): string {
  // Dates are stored as calendar days; format in UTC so they never shift a day.
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/** Excerpt from frontmatter, falling back to the first ~160 chars of the body. */
export function postExcerpt(post: Post, max = 160): string {
  if (post.data.excerpt) return post.data.excerpt;
  const text = (post.body ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}
