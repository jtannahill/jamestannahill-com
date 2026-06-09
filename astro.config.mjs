import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // Apex is canonical: www 301s to the apex via a CF redirect rule, and all
  // page canonicals use the apex. `site` drives sitemap URLs — keep aligned
  // or GSC flags every sitemap entry as "Page with redirect".
  site: 'https://jamestannahill.com',
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
  redirects: {
    '/about': '/',
    '/insights': 'https://www.plocamium.com/globals',
  },
  integrations: [
    sitemap({
      serialize(item) {
        // No lastmod: stamping build time on every URL is an inaccurate
        // lastmod, which Google's sitemap guidelines say gets ignored.
        if (item.url === 'https://jamestannahill.com/') {
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
