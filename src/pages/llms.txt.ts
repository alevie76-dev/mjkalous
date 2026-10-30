// llms.txt (https://llmstxt.org): a plain-Markdown summary of the site for AI tools.
// Built from consts.ts and the blog collection so it never drifts from the site.
import type { APIContext } from 'astro';
import { AUTHOR, BOOK, SITE, SOCIAL, SPEAKING_TOPICS } from '../consts';
import { getPosts, postExcerpt, postUrl } from '../lib/posts';

export async function GET(context: APIContext) {
  const abs = (path: string) => new URL(path, context.site).toString();
  const posts = await getPosts();

  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${AUTHOR.description}`,
    '',
    `Author of *${BOOK.title}* (${BOOK.publisher.name}, ${BOOK.datePublished.slice(0, 4)}). ${BOOK.blurb}`,
    '',
    `Topics: ${AUTHOR.knowsAbout.join(', ')}.`,
    '',
    '## Pages',
    '',
    `- [Home](${abs('/')}): Introduction to Michael and his book`,
    `- [About](${abs('/about')}): Michael's story, background, and credentials`,
    `- [The Book](${abs('/book')}): About the book, who it's for, FAQ, and where to buy *${BOOK.title}*`,
    `- [Speaking](${abs('/speaking')}): Talks Michael offers and how to book him`,
    `- [Newsletter](${abs('/newsletter')}): The Elder at the Gate, Michael's free monthly letter`,
    `- [Blog](${abs('/blog')}): Articles on trauma recovery, faith, and relationships`,
    `- [Contact](${abs('/contact')}): Get in touch with Michael`,
    '',
    '## The Book',
    '',
    `- Title: ${BOOK.title}`,
    `- Tagline: ${BOOK.tagline.join(' ')}`,
    `- ISBN: ${BOOK.isbn}`,
    `- Publisher: ${BOOK.publisher.name}`,
    `- Published: ${BOOK.datePublished}`,
    `- Pages: ${BOOK.pages}`,
    ...BOOK.retailers.map((r) => `- [Buy on ${r.name}](${r.href})`),
    '',
    '## Speaking Topics',
    '',
    ...SPEAKING_TOPICS.map((t) => `- ${t.title}: ${t.body}`),
    '',
    '## Blog Posts',
    '',
    ...posts.map((post) => `- [${post.data.title}](${abs(postUrl(post))}): ${postExcerpt(post)}`),
    '',
    '## Optional',
    '',
    `- [${AUTHOR.practice.name}](${AUTHOR.practice.url}): Michael's counseling practice in ${AUTHOR.locality}, ${AUTHOR.region}`,
    ...SOCIAL.map((s) => `- [${s.name}](${s.href})`),
    `- Email: ${SITE.email}`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
