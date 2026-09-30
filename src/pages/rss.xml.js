import rss from '@astrojs/rss';
import { SITE } from '../consts';
import { getPosts, postExcerpt, postUrl } from '../lib/posts';

export async function GET(context) {
  const posts = await getPosts();
  return rss({
    title: `${SITE.name} — Blog`,
    description: SITE.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: postExcerpt(post),
      categories: post.data.categories,
      link: postUrl(post),
    })),
  });
}
