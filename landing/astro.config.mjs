// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://linvnix.com',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'vi', 'de', 'es', 'fr', 'ja', 'ko', 'th', 'zh'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    icon({ include: { lucide: ['*'] } }),
    react(),
    sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', vi: 'vi', de: 'de', es: 'es', fr: 'fr', ja: 'ja', ko: 'ko', th: 'th', zh: 'zh' } } }),
  ],
});
