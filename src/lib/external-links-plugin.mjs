// Sätteri hast plugin: links in blog posts that point to other sites open in a new tab,
// so readers keep mjkalous.com open. Links to mjkalous.com, relative links,
// #anchors, and mailto:/tel: are left alone.
const SITE_HOSTS = new Set(['mjkalous.com', 'www.mjkalous.com']);

function isExternal(href) {
  if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) return false;
  try {
    return !SITE_HOSTS.has(new URL(href).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export const externalLinks = {
  name: 'external-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const props = node.properties ?? {};
      if (!isExternal(props.href)) return;
      const rel = new Set([].concat(props.rel ?? []));
      rel.add('noopener');
      ctx.setProperty(node, 'target', '_blank');
      ctx.setProperty(node, 'rel', [...rel]);
      ctx.appendChild(node, {
        type: 'element',
        tagName: 'span',
        properties: { className: ['sr-only'] },
        children: [{ type: 'text', value: ' (opens in a new tab)' }],
      });
    },
  },
};
