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
  // Tagline and blurb from the publisher's promotional banner.
  tagline: ['Overcoming the past.', 'Healing the present.', 'Building a better future.'],
  blurb:
    'A powerful true story of survival, faith, and restoration—offering hope to anyone navigating the pain of the past and reaching for a better tomorrow.',
  isbn: '9798899220968',
  retailers: [
    { name: 'Amazon', href: 'https://www.amazon.com/dp/B0GVPYY6GX' },
    { name: 'Barnes & Noble', href: 'https://www.barnesandnoble.com/s/9798899220968' },
    { name: 'Bookshop.org', href: 'https://bookshop.org/book/9798899220968' },
    { name: 'Page Publishing', href: 'https://pagepublishing.com/books/?book=wisdom-from-the-wreckage' },
    { name: 'Tertulia', href: 'https://tertulia.com/book/9798899220968' },
  ],
};

export const POSTS_PER_PAGE = 12;
