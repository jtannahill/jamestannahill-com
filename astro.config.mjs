import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.jamestannahill.com',
  output: 'static',
  redirects: {
    '/about': '/',
    '/insights': 'https://www.plocamium.com/globals',
  },
  integrations: [
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
