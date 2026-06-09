# jamestannahill.com

Personal site for James Tannahill: operator, investor, builder.

**Live:** [jamestannahill.com](https://jamestannahill.com)

## Stack

- [Astro 6](https://astro.build): SSR build, deployed as a Cloudflare Worker
- [Tailwind CSS 4](https://tailwindcss.com): utility-first styling
- [Cloudflare Workers](https://workers.cloudflare.com) + [R2](https://developers.cloudflare.com/r2/): hosting, edge runtime, and large-asset storage (`media.jamestannahill.com` for video >25 MiB)
- Astro Actions → AWS SES: contact form backend with honeypot + [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)
- NHG Display (Roman 400, Medium 500, Bold 700): self-hosted via `fonts.jamestannahill.com`

## Structure

```
src/
  components/   # Page sections (Hero, Bio, Ventures, FAQ, etc.)
  layouts/      # BaseLayout with Google Analytics + scroll reveal
  pages/        # index, faqs (contact), privacy, terms, accessibility
                # privacy: scoped to jamestannahill.com + map./contact. subdomains
                # (all three ship the same GA4 property G-WRDEHD4QYL)
  styles/       # global.css (CSS vars, font-face, scroll reveal)
public/
  logos/        # Venture logos (PNG, mix-blend-mode:multiply)
  hero-bg.jpg   # Hero background
  headshot.jpg  # Bio section portrait
  james-casual.jpg  # CasualSection full-width photo
```

Videos (large, not in repo: served from R2 at `media.jamestannahill.com`):
- `videos/contact-bg.mp4`: contact page background
- `videos/rdlb-brand-equity-capsule-1080.mp4`: RDLB Brand Equity Capsule (desktop, 1080p)
- `videos/rdlb-brand-equity-capsule-720.mp4`: RDLB Brand Equity Capsule (mobile, 720p)
- `videos/rdlb-poster.jpg`: poster frame

## Development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
npx wrangler deploy
```

Worker assets are versioned by Wrangler; large media lives in the `media-jamestannahill-com` R2 bucket and is served from `media.jamestannahill.com`.

## DNS

Cloudflare-native: Worker bound to `jamestannahill.com` + `www.jamestannahill.com` via a Workers route. TLS is managed by Cloudflare.
