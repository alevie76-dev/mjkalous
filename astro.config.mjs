// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { satteri } from '@astrojs/markdown-satteri';
import { externalLinks } from './src/lib/external-links-plugin.mjs';

export default defineConfig({
  site: 'https://mjkalous.com',
  output: 'static',
  trailingSlash: 'ignore',
  markdown: {
    processor: satteri({ hastPlugins: [externalLinks] }),
  },
  integrations: [
    react(),
    sitemap({ filter: (page) => !page.includes('/admin') }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  env: {
    schema: {
      // Read at build time and inlined into the page. Leave unset to disable tracking.
      GA_MEASUREMENT_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      META_PIXEL_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      // Kit.com form ID (the number in the form's embed code / URL). Public, so it has a default;
      // set KIT_FORM_ID in Vercel only to point at a different form.
      KIT_FORM_ID: envField.string({ context: 'client', access: 'public', default: '9992996' }),
    },
  },
});
