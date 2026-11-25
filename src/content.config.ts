import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    // Optional custom URL (/blog/<slug>). When blank, the URL comes from the filename.
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens only.')
      .optional(),
    date: z.coerce.date(),
    // Free-form strings (not an enum) so a new category added in the CMS never breaks the build.
    categories: z.array(z.string()).default(['Uncategorized']),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    excerpt: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// Past editions of the monthly letter, published on the site after they go out by email.
const newsletter = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/newsletter' }),
  schema: z.object({
    title: z.string(),
    // Optional custom URL (/newsletter/<slug>). When blank, the URL comes from the filename.
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens only.')
      .optional(),
    // The day the letter went out by email.
    date: z.coerce.date(),
    excerpt: z.string().optional(),
    // Keep true until the email has gone out, so web readers never see it first.
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, newsletter };
