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
    sitemap({
      serialize(item) {
        const today = new Date().toISOString().split('T')[0];
        item.lastmod = today;
        if (item.url === 'https://www.jamestannahill.com/') {
          item.priority = 1.0;
          item.changefreq = 'monthly';
        } else if (item.url.includes('/faqs')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        } else {
          item.priority = 0.3;
          item.changefreq = 'yearly';
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
