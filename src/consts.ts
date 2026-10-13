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

// Facts about Michael used in the structured data (schema.org Person) on every page.
export const AUTHOR = {
  description:
    'Michael J. Kalous is a Licensed Clinical Professional Counselor (LCPC), Christian counselor, author, and TEDx speaker from Helena, Montana. He writes about healing from trauma, faith, and relationships.',
  jobTitle: 'Licensed Clinical Professional Counselor, Christian Counselor, Author',
  license: 'Licensed Clinical Professional Counselor (LCPC)',
  knowsAbout: [
    'Trauma recovery',
    'Childhood abuse and neglect',
    'Resilience',
    'Christian counseling',
    'Faith and healing',
    'Marriage and relationships',
    'Parenting',
  ],
  locality: 'Helena',
  region: 'MT',
  country: 'US',
};

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/book', label: 'The Book' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export const SOCIAL = [
  { name: 'Instagram', href: 'https://www.instagram.com/kalousmichael' },
  { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=100093438237020' },
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
  publisher: { name: 'Page Publishing', url: 'https://pagepublishing.com' },
  datePublished: '2026-04-24',
  pages: 200,
  retailers: [
    { name: 'Amazon', href: 'https://www.amazon.com/dp/B0GVPYY6GX' },
    { name: 'Barnes & Noble', href: 'https://www.barnesandnoble.com/s/9798899220968' },
    { name: 'Bookshop.org', href: 'https://bookshop.org/book/9798899220968' },
    { name: 'Page Publishing', href: 'https://pagepublishing.com/books/?book=wisdom-from-the-wreckage' },
    { name: 'Tertulia', href: 'https://tertulia.com/book/9798899220968' },
  ],
};

export const POSTS_PER_PAGE = 12;
