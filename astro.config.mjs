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
  // Astro hashes generated inline scripts/styles, so arbitrary injected scripts
  // cannot execute. Admin is a static public file with its own staged policy.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com https://www.facebook.com",
        "font-src 'self'",
        "connect-src 'self' https://app.kit.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net https://vitals.vercel-insights.com",
        "frame-src https://www.youtube-nocookie.com https://www.googletagmanager.com",
        "form-action 'self' https://app.kit.com",
      ],
      scriptDirective: {
        resources: ["'self'", 'https://www.googletagmanager.com', 'https://connect.facebook.net', 'https://va.vercel-scripts.com'],
      },
      // React and analytics libraries can set style attributes dynamically.
      styleDirective: {
        resources: [
          { resource: "'self'", kind: 'element' },
          { resource: "'unsafe-inline'", kind: 'attribute' },
        ],
      },
    },
  },
  // Inline the (small) site CSS so it doesn't block first render on mobile.
  build: { inlineStylesheets: 'always' },
  // Match Vercel's URLs so sitemap entries do not redirect.
  trailingSlash: 'never',
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
