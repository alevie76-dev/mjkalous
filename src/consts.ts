export const SITE = {
  name: 'Michael J. Kalous',
  title: 'Michael J. Kalous — Author of Wisdom From the Wreckage',
  description:
    'Therapist, author, and speaker Michael J. Kalous offers hope, healing, and practical tools for anyone overcoming trauma and rebuilding their relationships.',
  url: 'https://mjkalous.com',
  email: 'michael@mjkalous.com',
  tagline: '“We are and are becoming who we believe we are, and we act out our story based on that belief.”',
  locale: 'en_US',
};

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export const SOCIAL = [
  { name: 'Instagram', href: 'https://www.instagram.com/kalousmichael' },
  // TODO: swap for the dedicated author page once it exists (Phase 2).
  { name: 'Facebook', href: 'https://www.facebook.com/michael.kalous.12' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/michael-kalous-39463641b/' },
] as const;

export const BOOK = {
  title: 'Wisdom From the Wreckage',
  description:
    'Hope, healing, and practical tools for anyone overcoming trauma and rebuilding their relationships.',
  isbn: '9798899220968',
  primaryUrl: 'https://www.amazon.com/dp/B0GVPYY6GX',
  retailers: [
    { name: 'Amazon', href: 'https://www.amazon.com/dp/B0GVPYY6GX' },
    { name: 'Barnes & Noble', href: 'https://www.barnesandnoble.com/s/9798899220968' },
    { name: 'Bookshop.org', href: 'https://bookshop.org/book/9798899220968' },
    { name: 'Page Publishing', href: 'https://pagepublishing.com/books/?book=wisdom-from-the-wreckage' },
    { name: 'Tertulia', href: 'https://tertulia.com/book/9798899220968' },
  ],
};

// Keep in sync with the `categories` options in public/admin/config.yml.
export const CATEGORIES = [
  'Spiritual Reflections',
  'Faith & Calling',
  'Healing & Recovery',
  'Relationships',
  'Introduction',
  'Uncategorized',
] as const;

export const POSTS_PER_PAGE = 12;
