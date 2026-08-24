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
    // NOTE: '/about' is deliberately NOT here. A config redirect whose target
    // is a prerendered page gets baked into _redirects, where the Cloudflare
    // adapter's internal ASSETS.fetch follows the 301 and returns 200 with the
    // homepage body. GSC (2026-08-13) had /about filed under "Alternate page
    // with proper canonical tag" because of it. src/pages/about.astro is an
    // SSR stub instead, so Astro returns a real 301. The two entries below are
    // fine: one target is external, the other is not a prerendered HTML page.
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
      // /profile is a noindex share landing (and /resume its 301 stub), so
      // keep both out of the sitemap and
      // avoid advertising a page we've told crawlers not to index. The rest
      // are 301 stubs, not pages: listing them would tell Google to keep
      // crawling URLs that only ever answer with a redirect, which is how
      // they end up parked in "Crawled - currently not indexed".
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/+$/, '');
        return ![
          '/profile',
          '/resume',
          '/about',
          '/agency',
          '/blog',
          '/contact',
        ].includes(
          path,
        );
      },
      serialize(item) {
        // Emit the no-trailing-slash form, matching the canonical tags and
        // wrangler.toml's html_handling = "drop-trailing-slash". Previously
        // the sitemap advertised /faqs/ while Google spent its crawl budget
        // on /faqs; as of 2026-08-13 the slashed form had never been fetched
        // at all ("Discovered - currently not indexed") while the bare form
        // sat in "Crawled - currently not indexed".
        item.url = item.url.replace(
          /^(https:\/\/jamestannahill\.com\/.+?)\/+$/,
          '$1',
        );

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
