# jamestannahill.com

Personal site for James Tannahill — operator, investor, builder.

**Live:** [jamestannahill.com](https://www.jamestannahill.com)

## Stack

- [Astro 6](https://astro.build) — static site generator
- [Tailwind CSS 4](https://tailwindcss.com) — utility-first styling
- AWS S3 + CloudFront — hosting and CDN
- AWS SES + API Gateway + Lambda — contact form backend
- NHG Display (Roman 400, Medium 500, Bold 700) — self-hosted via fonts.jamestannahill.com

## Structure

```
src/
  components/   # Page sections (Hero, Bio, Ventures, FAQ, etc.)
  layouts/      # BaseLayout with Google Analytics + scroll reveal
  pages/        # index, faqs (contact), privacy, terms, accessibility
  styles/       # global.css (CSS vars, font-face, scroll reveal)
public/
  logos/        # Venture logos (PNG, mix-blend-mode:multiply)
  hero-bg.jpg   # Hero background
  headshot.jpg  # Bio section portrait
  james-casual.jpg  # CasualSection full-width photo
```

Videos (large, not in repo — stored directly in S3):
- `videos/contact-bg.mp4` — contact page background
- `videos/rdlb-brand-equity-capsule-1080.mp4` — RDLB Brand Equity Capsule (desktop, 1080p)
- `videos/rdlb-brand-equity-capsule-720.mp4` — RDLB Brand Equity Capsule (mobile, 720p)
- `videos/rdlb-poster.jpg` — poster frame

## Development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build

# Assets (long cache)
aws s3 sync dist/ s3://jamestannahill.com-site --delete \
  --exclude "*.html" --exclude "sitemap*" --exclude "robots.txt" --exclude "llms*" \
  --cache-control "public,max-age=31536000,immutable"

# HTML + meta files (no cache)
aws s3 sync dist/ s3://jamestannahill.com-site --delete \
  --exclude "*" --include "*.html" --include "sitemap*" --include "robots.txt" --include "llms*" \
  --cache-control "public,max-age=0,must-revalidate"

aws cloudfront create-invalidation --distribution-id E1KASWFXCUI8NS --paths "/*"
```

## DNS

Cloudflare → CloudFront (`d9ttkh3tz30f6.cloudfront.net`)  
SSL via AWS ACM cert for `jamestannahill.com` + `www.jamestannahill.com`
