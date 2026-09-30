import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
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

export const collections = { blog };
