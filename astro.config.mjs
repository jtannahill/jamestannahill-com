import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // Apex is canonical: www 301s to the apex via a CF redirect rule, and all
  // page canonicals use the apex. `site` drives sitemap URLs, so keep aligned
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
    // @astrojs/sitemap emits sitemap-index.xml + sitemap-0.xml, so the
    // conventional /sitemap.xml 404s. robots.txt points at the right file
    // and Google is fine, but plenty of crawlers probe /sitemap.xml directly.
    // 301 (not the string shorthand's default 302) so the convention resolves
    // permanently.
    '/sitemap.xml': { status: 301, destination: '/sitemap-index.xml' },
  },
  integrations: [
    sitemap({
      // /resume is a noindex share landing, so keep it out of the sitemap and
      // avoid advertising a page we've told crawlers not to index.
      filter: (page) => !page.includes('/resume'),
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
    build: {
      // Our CSP is strict: `script-src 'self'` with no 'unsafe-inline', nonce,
      // or hash (see src/lib/security-headers.ts). Astro inlines small
      // import-less hoisted scripts (<4KB) directly into the HTML, and the
      // browser blocks every inline <script> under that policy, which
      // silently killed the mobile hamburger toggle, scroll-reveal fallback,
      // and the RDLB reel. Force script chunks to emit as external
      // `_astro/*.js` files so `'self'` covers them; keep Vite's default
      // inlining for images/fonts by returning undefined for other assets.
      assetsInlineLimit(filePath) {
        if (/\.(?:js|mjs|cjs|ts)$/.test(filePath)) return false;
        return undefined;
      },
    },
  },
});
