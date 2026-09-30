// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://mjkalous.com',
  output: 'static',
  trailingSlash: 'ignore',
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
      // Kit.com form ID (the number in the form's embed code / URL).
      KIT_FORM_ID: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
});
