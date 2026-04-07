# jamestannahill.com Site Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild jamestannahill.com as a static Astro 6 site deployed to S3 + CloudFront via CDK, replacing the current Wix site with an identical-content, production-grade personal site.

**Architecture:** Astro 6 static output → S3 bucket (private) → CloudFront OAC distribution. CDK manages all AWS infra. GitHub Actions deploys on push to main. Contact form via Formspree (no Lambda needed). DNS cutover is a manual GoDaddy step after CloudFront URL is confirmed.

**Tech Stack:** Astro 6, Tailwind CSS 4, TypeScript, AWS CDK v2, S3, CloudFront, ACM, Formspree

---

## File Map

```
jamestannahill-com/
├── astro.config.mjs              # Astro config — static output, sitemap, Tailwind vite plugin
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── public/
│   ├── robots.txt
│   ├── og.png                    # 1200x630 OG image (copy from Wix or new)
│   └── favicon.ico
├── src/
│   ├── styles/
│   │   └── global.css            # Tailwind base import + custom CSS vars/fonts
│   ├── layouts/
│   │   └── BaseLayout.astro      # HTML shell, SEO head, header, footer, schema
│   ├── components/
│   │   ├── SEOHead.astro         # All meta/OG/Twitter tags + JSON-LD schema
│   │   ├── Header.astro          # Nav: ABOUT | THE AGENCY | INSIGHTS | CONTACT
│   │   ├── Footer.astro          # Copyright, nav links, LinkedIn icon
│   │   ├── Hero.astro            # "Operator. Investor. Builder." headline block
│   │   ├── BioSection.astro      # Bio paragraph + 6 competency cards
│   │   ├── VenturesSection.astro # 8 venture cards (Plocamium, 1ness, etc.)
│   │   ├── FAQAccordion.astro    # 6 FAQ items with expand/collapse
│   │   └── ContactForm.astro     # Formspree-powered form (name, email, phone, subject, message)
│   └── pages/
│       ├── index.astro           # Home: Hero + Bio + Ventures
│       ├── about.astro           # Redirects to / (same content, Wix parity)
│       ├── faqs.astro            # ContactForm + FAQAccordion
│       ├── insights.astro        # Redirects to https://www.plocamium.com/globals
│       └── 404.astro             # Simple 404 page
├── cdk/
│   ├── bin/
│   │   └── app.ts                # CDK entrypoint — JamesTannahillSiteStack
│   ├── lib/
│   │   └── static-site-stack.ts  # S3 + CloudFront OAC + ACM (no Route53 automation)
│   ├── cdk.json
│   ├── package.json
│   └── tsconfig.json
└── .github/
    └── workflows/
        └── deploy.yml            # Build + sync to S3 + invalidate CloudFront on push to main
```

---

## Task 1: Initialize Astro project

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/styles/global.css`

- [ ] **Step 1: Scaffold the project**

```bash
cd ~/jamestannahill-com
npm create astro@latest . -- --template minimal --typescript strict --no-git --install
```

- [ ] **Step 2: Install dependencies**

```bash
npm install tailwindcss @tailwindcss/vite @astrojs/sitemap
npm install -D tsx
```

- [ ] **Step 3: Write astro.config.mjs**

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.jamestannahill.com',
  output: 'static',
  integrations: [
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 4: Write src/styles/global.css**

```css
@import "tailwindcss";

:root {
  --color-ink: #0a0a0a;
  --color-muted: #6b7280;
  --color-accent: #1a1a1a;
  --color-surface: #f9f9f8;
  --color-border: #e5e5e5;
}

html {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: var(--color-ink);
  background: #fff;
  -webkit-font-smoothing: antialiased;
}

/* NHG Display from fonts.jamestannahill.com */
@font-face {
  font-family: 'NHG Display';
  src: url('https://fonts.jamestannahill.com/NHGDisplayMedium.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: 'NHG Display';
  src: url('https://fonts.jamestannahill.com/NHGDisplayBold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```
Expected: Astro dev server running at http://localhost:4321

- [ ] **Step 6: Commit**

```bash
cd ~/jamestannahill-com
git init && git add -A
git commit -m "feat: initialize Astro 6 + Tailwind 4 project"
```

---

## Task 2: BaseLayout + SEOHead + Header + Footer

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/SEOHead.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Write src/components/SEOHead.astro**

```astro
---
interface Props {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
}
const { title, description, canonical, ogImage = 'https://www.jamestannahill.com/og.png' } = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://www.jamestannahill.com/#person",
      "name": "James Tannahill",
      "url": "https://www.jamestannahill.com",
      "jobTitle": "Private Equity Executive & Founder",
      "worksFor": { "@type": "Organization", "name": "Plocamium Holdings" },
      "alumniOf": [
        { "@type": "CollegeOrUniversity", "name": "Cornell University — Johnson School of Management" },
        { "@type": "CollegeOrUniversity", "name": "University of Essex" },
        { "@type": "CollegeOrUniversity", "name": "Denison University" }
      ],
      "sameAs": [
        "https://www.linkedin.com/in/jamesstannahill/",
        "https://github.com/jtannahill",
        "https://www.bloomberg.com/profile/person/23291921"
      ],
      "knowsAbout": ["Private Equity", "Healthcare Technology", "AI Systems", "Strategic Finance"]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.jamestannahill.com/#website",
      "url": "https://www.jamestannahill.com",
      "name": "James Tannahill",
      "description": description
    }
  ]
};
---
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />

<!-- OG -->
<meta property="og:type" content="profile" />
<meta property="og:url" content={canonical} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogImage} />
<meta property="og:locale" content="en_US" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImage} />

<!-- Schema -->
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

- [ ] **Step 2: Write src/components/Header.astro**

```astro
---
const navLinks = [
  { label: 'ABOUT', href: '/' },
  { label: 'THE AGENCY', href: 'https://www.1nessagency.com/', external: true },
  { label: 'RDLB', href: 'https://www.rdlb.nyc/', external: true },
  { label: 'INSIGHTS', href: 'https://www.plocamium.com/globals', external: true },
  { label: 'CONTACT', href: '/faqs' },
];
---
<header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-[var(--color-border)]">
  <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
    <a href="/" class="text-sm font-medium tracking-widest uppercase" style="font-family: 'NHG Display', sans-serif;">
      James Tannahill
    </a>
    <nav class="hidden md:flex items-center gap-8">
      {navLinks.map(link => (
        <a
          href={link.href}
          target={link.external ? '_blank' : undefined}
          rel={link.external ? 'noopener noreferrer' : undefined}
          class="text-xs tracking-widest uppercase text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          {link.label}
        </a>
      ))}
    </nav>
    <!-- Mobile menu button -->
    <button id="menu-toggle" class="md:hidden p-2" aria-label="Toggle menu">
      <span class="block w-5 h-0.5 bg-current mb-1"></span>
      <span class="block w-5 h-0.5 bg-current mb-1"></span>
      <span class="block w-5 h-0.5 bg-current"></span>
    </button>
  </div>
  <!-- Mobile nav -->
  <div id="mobile-menu" class="hidden md:hidden border-t border-[var(--color-border)] bg-white">
    {navLinks.map(link => (
      <a
        href={link.href}
        target={link.external ? '_blank' : undefined}
        rel={link.external ? 'noopener noreferrer' : undefined}
        class="block px-6 py-3 text-xs tracking-widest uppercase text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      >
        {link.label}
      </a>
    ))}
  </div>
</header>
<script>
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  toggle?.addEventListener('click', () => menu?.classList.toggle('hidden'));
</script>
```

- [ ] **Step 3: Write src/components/Footer.astro**

```astro
---
const year = new Date().getFullYear();
const navLinks = [
  { label: 'About', href: '/' },
  { label: 'The Agency', href: 'https://www.1nessagency.com/', external: true },
  { label: 'RDLB', href: 'https://www.rdlb.nyc/', external: true },
  { label: 'Insights', href: 'https://www.plocamium.com/globals', external: true },
  { label: 'Contact', href: '/faqs' },
];
---
<footer class="border-t border-[var(--color-border)] py-10 mt-24">
  <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
    <p class="text-xs text-[var(--color-muted)]">© {year} James Tannahill</p>
    <nav class="flex flex-wrap items-center gap-6">
      {navLinks.map(link => (
        <a
          href={link.href}
          target={link.external ? '_blank' : undefined}
          rel={link.external ? 'noopener noreferrer' : undefined}
          class="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          {link.label}
        </a>
      ))}
    </nav>
    <a href="https://www.linkedin.com/in/jamesstannahill/" target="_blank" rel="noopener noreferrer"
       class="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors" aria-label="LinkedIn">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    </a>
  </div>
</footer>
```

- [ ] **Step 4: Write src/layouts/BaseLayout.astro**

```astro
---
import SEOHead from '../components/SEOHead.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
  canonical: string;
}
const { title, description, canonical } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <SEOHead title={title} description={description} canonical={canonical} />
  </head>
  <body>
    <Header />
    <main class="pt-14">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 5: Add public/robots.txt**

```txt
User-agent: *
Allow: /

Sitemap: https://www.jamestannahill.com/sitemap-index.xml
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add BaseLayout, SEOHead, Header, Footer"
```

---

## Task 3: Home page — Hero + BioSection + VenturesSection

**Files:**
- Create: `src/components/Hero.astro`
- Create: `src/components/BioSection.astro`
- Create: `src/components/VenturesSection.astro`
- Create: `src/pages/index.astro`

- [ ] **Step 1: Write src/components/Hero.astro**

```astro
---
---
<section class="min-h-[60vh] flex flex-col justify-center px-6 py-24 max-w-6xl mx-auto">
  <p class="text-xs tracking-[0.25em] uppercase text-[var(--color-muted)] mb-6">
    NYC — Private Equity
  </p>
  <h1 class="text-5xl md:text-7xl font-bold leading-none tracking-tight mb-8"
      style="font-family: 'NHG Display', sans-serif;">
    Operator.<br/>Investor.<br/>Builder.
  </h1>
  <p class="text-lg md:text-xl text-[var(--color-muted)] max-w-2xl leading-relaxed">
    Turning proprietary AI, brand infrastructure, and data systems into compounding enterprise value.
  </p>
  <div class="flex gap-4 mt-10">
    <a href="/faqs"
       class="inline-block px-6 py-3 bg-[var(--color-ink)] text-white text-sm tracking-wider uppercase hover:bg-[var(--color-accent)] transition-colors">
      Get in Touch
    </a>
    <a href="https://plocamium.com" target="_blank" rel="noopener noreferrer"
       class="inline-block px-6 py-3 border border-[var(--color-border)] text-sm tracking-wider uppercase hover:border-[var(--color-ink)] transition-colors">
      Plocamium Holdings
    </a>
  </div>
</section>
```

- [ ] **Step 2: Write src/components/BioSection.astro**

```astro
---
const competencies = [
  {
    title: 'Capital & Financial Architecture',
    body: 'Strategic finance, capital deployment, investment structuring, M&A advisory.',
  },
  {
    title: 'Applied Intelligence',
    body: 'AI systems architecture, ML pipelines, intelligent automation, data infrastructure.',
  },
  {
    title: 'Operational Engineering',
    body: 'Post-transaction integration, organizational architecture, operational transformation.',
  },
  {
    title: 'Brand & Market Positioning',
    body: 'Brand architecture, narrative positioning, market differentiation.',
  },
  {
    title: 'Regulatory & Data Systems',
    body: 'Regulatory-compliant growth systems, digital infrastructure, data systems.',
  },
  {
    title: 'Leadership & Decision Design',
    body: 'Decision design, leadership frameworks, organizational operating models.',
  },
];
---
<section class="max-w-6xl mx-auto px-6 py-16 border-t border-[var(--color-border)]">
  <div class="grid md:grid-cols-2 gap-12 mb-16">
    <div>
      <h2 class="text-2xl font-bold mb-6" style="font-family: 'NHG Display', sans-serif;">
        The Work
      </h2>
      <p class="text-[var(--color-muted)] leading-relaxed mb-4">
        James Tannahill works at the intersection of complex systems: biological, financial, digital, operational.
        His discipline is engineering resilience — structures built to absorb pressure and compound advantage.
      </p>
      <p class="text-[var(--color-muted)] leading-relaxed mb-4">
        He operates across healthcare, industrials, technology, and finance. His background spans biochemistry,
        biotechnology, equity research, strategic finance, and private equity operations.
      </p>
      <p class="text-[var(--color-muted)] leading-relaxed">
        Cornell's Johnson School of Management sharpened his strategic discipline. Today he leads Plocamium Holdings,
        operates through 1nessAgency and RDLB, and builds AI-native products that compound across decades.
      </p>
    </div>
    <div class="space-y-2 text-sm text-[var(--color-muted)]">
      <p class="font-medium text-[var(--color-ink)]">Education</p>
      <p>MBA, Finance & Strategy — Cornell University, Johnson School of Management (2024)</p>
      <p>M.S., Biotechnology — University of Essex</p>
      <p>B.S., Biochemistry — Denison University (2015)</p>
      <div class="pt-4">
        <p class="font-medium text-[var(--color-ink)] mb-2">Memberships</p>
        <p>Young Presidents' Organization (YPO)</p>
        <p>The Economic Club of New York</p>
      </div>
    </div>
  </div>

  <h3 class="text-sm tracking-widest uppercase text-[var(--color-muted)] mb-8">Competencies</h3>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--color-border)]">
    {competencies.map(c => (
      <div class="bg-white p-6">
        <p class="font-medium text-sm mb-2" style="font-family: 'NHG Display', sans-serif;">{c.title}</p>
        <p class="text-xs text-[var(--color-muted)] leading-relaxed">{c.body}</p>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Write src/components/VenturesSection.astro**

```astro
---
const ventures = [
  {
    name: 'Plocamium Holdings',
    description: 'Hybrid investment and operational advisory. 80% advisory-led, 20% direct balance sheet. Targets enterprises valued $10M–$500M.',
    url: 'https://plocamium.com',
  },
  {
    name: '1nessAgency',
    description: 'Compliance-focused digital marketing for regulated industries. Built for healthcare.',
    url: 'https://www.1nessagency.com/',
  },
  {
    name: 'RDLB',
    description: 'Global brand strategy and communications for institutional capital markets.',
    url: 'https://www.rdlb.nyc/',
  },
  {
    name: 'HLTHvrs',
    description: 'HIPAA-conscious marketing intelligence platform for behavioral health, psychiatric, and wellness practices.',
    url: 'https://hlthvrs.com/',
  },
  {
    name: 'MonkeyThorn Meet',
    description: 'Privacy-first, browser-based video conferencing with end-to-end AES-GCM encryption.',
    url: null,
  },
  {
    name: 'gOOOvy',
    description: 'Auto-reply service for Google Voice texts with scheduled out-of-office responses.',
    url: 'https://gooovy.com',
  },
  {
    name: 'HMU API',
    description: 'Programmable communication gateway replacing traditional email with structured API endpoints.',
    url: 'https://hmuapi.com',
  },
  {
    name: 'NewYorkLab',
    description: 'Data-driven environmental intelligence platform quantifying climate-related risks in urban areas.',
    url: 'https://newyorklab.co/',
  },
];
---
<section class="max-w-6xl mx-auto px-6 py-16 border-t border-[var(--color-border)]">
  <h3 class="text-sm tracking-widest uppercase text-[var(--color-muted)] mb-8">Ventures & Platforms</h3>
  <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)]">
    {ventures.map(v => (
      <div class="bg-white p-6 flex flex-col">
        <p class="font-medium text-sm mb-2" style="font-family: 'NHG Display', sans-serif;">{v.name}</p>
        <p class="text-xs text-[var(--color-muted)] leading-relaxed flex-1">{v.description}</p>
        {v.url && (
          <a href={v.url} target="_blank" rel="noopener noreferrer"
             class="mt-4 text-xs tracking-wider uppercase hover:underline">
            Visit →
          </a>
        )}
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 4: Write src/pages/index.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import BioSection from '../components/BioSection.astro';
import VenturesSection from '../components/VenturesSection.astro';
---
<BaseLayout
  title="James Tannahill — Private Equity Operator & Multi-Venture Founder"
  description="NYC-based private equity executive, multi-venture founder, and strategic investor. President of Plocamium Holdings. Co-Founder of 1nessAgency and HLTHvrs."
  canonical="https://www.jamestannahill.com"
>
  <Hero />
  <BioSection />
  <VenturesSection />
</BaseLayout>
```

- [ ] **Step 5: Check in browser**

```bash
npm run dev
```
Open http://localhost:4321 — verify hero, bio, ventures render correctly.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: home page — hero, bio, ventures"
```

---

## Task 4: FAQs / Contact page

**Files:**
- Create: `src/components/FAQAccordion.astro`
- Create: `src/components/ContactForm.astro`
- Create: `src/pages/faqs.astro`

- [ ] **Step 1: Sign up for Formspree and get endpoint**

Go to https://formspree.io → create account → new form → copy the endpoint URL (format: `https://formspree.io/f/XXXXXXXX`). Replace `YOUR_FORMSPREE_ID` below.

- [ ] **Step 2: Write src/components/ContactForm.astro**

```astro
---
---
<div class="max-w-2xl">
  <h2 class="text-2xl font-bold mb-2" style="font-family: 'NHG Display', sans-serif;">Get in Touch</h2>
  <p class="text-sm text-[var(--color-muted)] mb-8">
    Or email directly: <a href="mailto:web@jamestannahill.com" class="underline">web@jamestannahill.com</a>
  </p>
  <form action="https://formspree.io/f/YOUR_FORMSPREE_ID" method="POST" class="space-y-4">
    <div class="grid sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs uppercase tracking-wider mb-1" for="firstName">First Name</label>
        <input id="firstName" name="firstName" type="text" required
               class="w-full border border-[var(--color-border)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-ink)]" />
      </div>
      <div>
        <label class="block text-xs uppercase tracking-wider mb-1" for="lastName">Last Name</label>
        <input id="lastName" name="lastName" type="text" required
               class="w-full border border-[var(--color-border)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-ink)]" />
      </div>
    </div>
    <div>
      <label class="block text-xs uppercase tracking-wider mb-1" for="email">Email</label>
      <input id="email" name="email" type="email" required
             class="w-full border border-[var(--color-border)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-ink)]" />
    </div>
    <div>
      <label class="block text-xs uppercase tracking-wider mb-1" for="phone">Phone</label>
      <input id="phone" name="phone" type="tel"
             class="w-full border border-[var(--color-border)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-ink)]" />
    </div>
    <div>
      <label class="block text-xs uppercase tracking-wider mb-1" for="subject">Subject</label>
      <input id="subject" name="subject" type="text" required
             class="w-full border border-[var(--color-border)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-ink)]" />
    </div>
    <div>
      <label class="block text-xs uppercase tracking-wider mb-1" for="message">Message</label>
      <textarea id="message" name="message" rows="5" required
                class="w-full border border-[var(--color-border)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-ink)] resize-none"></textarea>
    </div>
    <button type="submit"
            class="px-8 py-3 bg-[var(--color-ink)] text-white text-sm tracking-wider uppercase hover:bg-[var(--color-accent)] transition-colors">
      Send Message
    </button>
  </form>
</div>
```

- [ ] **Step 3: Write src/components/FAQAccordion.astro**

```astro
---
const faqs = [
  {
    q: 'How does value engineering differ from investment banking or management consulting?',
    a: 'Investment bankers optimize the transaction — find buyers, structure deals, negotiate terms. Management consultants diagnose problems and recommend frameworks. Value engineering executes the specific changes that make a business worth more before bankers take it to market. We don\'t write slide decks about what you should do. We build the revenue engines, data infrastructure, and growth systems that directly increase what a buyer is willing to pay.',
  },
  {
    q: 'What levers actually move valuation before a transaction?',
    a: 'Focus on metrics driving buyer multiples: recurring revenue mix, customer acquisition cost efficiency, gross margin expansion, reduction of key-person risk. A typical engagement builds scalable digital acquisition channels, performance attribution systems, and pricing restructures for predictable growth. Companies showing 12–18 months of engineered growth command 2–4x higher multiples than flat or founder-dependent revenue.',
  },
  {
    q: 'How do you engineer a premium exit multiple?',
    a: 'It goes beyond clean financials. Build diversified revenue streams not dependent on one client or channel, documented customer acquisition systems, real-time performance dashboards, and an independent management team. Stress-test against PE due diligence frameworks before negotiation begins.',
  },
  {
    q: 'What profile of company is the best fit?',
    a: 'Founder-led and PE-backed companies in the $5M–$100M revenue range, 12–36 months from transaction. Healthcare services, SaaS, professional services, industrials, regulated technology — where digital growth strategy and data infrastructure have outsized valuation impact.',
  },
  {
    q: 'Where does applied AI create real leverage in private equity?',
    a: 'Three areas: (1) Customer acquisition — AI-driven attribution identifies highest-LTV customers, reallocating spend in real time. (2) Operational efficiency — Automate reporting, detect anomalies, surface wasted budget. (3) Competitive intelligence — AI-powered market analysis benchmarks digital presence and identifies whitespace opportunities.',
  },
  {
    q: 'What does the first conversation look like?',
    a: 'A confidential diagnostic conversation about your business model, transaction timeline, and valuation levers. If the fit exists, we propose a scoped engagement with clear KPIs and a measurable impact target. No obligation, no generic pitch — every engagement is structured around what will actually move your multiple.',
  },
];
---
<div class="mt-16 border-t border-[var(--color-border)] pt-12">
  <h2 class="text-sm tracking-widest uppercase text-[var(--color-muted)] mb-8">Frequently Asked</h2>
  <div class="divide-y divide-[var(--color-border)]">
    {faqs.map((faq, i) => (
      <details class="group py-5">
        <summary class="flex justify-between items-start cursor-pointer list-none gap-4">
          <span class="font-medium text-sm leading-relaxed">{faq.q}</span>
          <span class="text-[var(--color-muted)] mt-0.5 flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
        </summary>
        <p class="mt-4 text-sm text-[var(--color-muted)] leading-relaxed max-w-3xl">{faq.a}</p>
      </details>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Write src/pages/faqs.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ContactForm from '../components/ContactForm.astro';
import FAQAccordion from '../components/FAQAccordion.astro';
---
<BaseLayout
  title="James Tannahill | Contact & Professional Inquiries"
  description="Get in touch with James Tannahill — private equity advisory, value engineering, and strategic partnerships."
  canonical="https://www.jamestannahill.com/faqs"
>
  <div class="max-w-6xl mx-auto px-6 py-16">
    <ContactForm />
    <FAQAccordion />
  </div>
</BaseLayout>
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```
Open http://localhost:4321/faqs — confirm form fields render, FAQs expand/collapse on click.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: FAQs and contact form page"
```

---

## Task 5: About + Insights + 404 pages

**Files:**
- Create: `src/pages/about.astro`
- Create: `src/pages/insights.astro`
- Create: `src/pages/404.astro`

- [ ] **Step 1: Write src/pages/about.astro** (same content as home, Wix parity)

```astro
---
// Wix /about served identical content to home — match that behavior
import { redirectToDefaultLocale } from 'astro:i18n';
---
<meta http-equiv="refresh" content="0; url=/" />
<script>window.location.replace('/');</script>
```

Actually, simpler — use Astro's redirect:

```astro
---
// src/pages/about.astro
export const prerender = true;
---
<script>window.location.replace('/');</script>
```

Even simpler, use a redirect in astro.config.mjs. Replace Step 1 with this approach:

In `astro.config.mjs`, add:
```js
export default defineConfig({
  // ... existing config ...
  redirects: {
    '/about': '/',
    '/insights': 'https://www.plocamium.com/globals',
  },
});
```

Then delete `src/pages/about.astro` and `src/pages/insights.astro` — the redirects handle them.

- [ ] **Step 2: Update astro.config.mjs with redirects**

```js
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
```

- [ ] **Step 3: Write src/pages/404.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout
  title="Page Not Found — James Tannahill"
  description="The page you're looking for doesn't exist."
  canonical="https://www.jamestannahill.com/404"
>
  <div class="max-w-6xl mx-auto px-6 py-32 text-center">
    <p class="text-xs tracking-widest uppercase text-[var(--color-muted)] mb-4">404</p>
    <h1 class="text-4xl font-bold mb-6" style="font-family: 'NHG Display', sans-serif;">Page not found.</h1>
    <a href="/" class="text-sm underline text-[var(--color-muted)] hover:text-[var(--color-ink)]">← Back to home</a>
  </div>
</BaseLayout>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: `dist/` created with index.html, faqs/index.html, 404.html — no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: about redirect, insights redirect, 404 page"
```

---

## Task 6: CDK infrastructure stack

**Files:**
- Create: `cdk/package.json`
- Create: `cdk/tsconfig.json`
- Create: `cdk/cdk.json`
- Create: `cdk/bin/app.ts`
- Create: `cdk/lib/static-site-stack.ts`

- [ ] **Step 1: Initialize CDK project**

```bash
cd ~/jamestannahill-com/cdk
npm install aws-cdk-lib constructs aws-cdk
```

- [ ] **Step 2: Write cdk/package.json**

```json
{
  "name": "jamestannahill-com-cdk",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "deploy": "cdk deploy --all --require-approval never"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.170.0",
    "constructs": "^10.0.0"
  },
  "devDependencies": {
    "aws-cdk": "^2.170.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 3: Write cdk/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["bin", "lib"]
}
```

- [ ] **Step 4: Write cdk/cdk.json**

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "watch": {
    "include": ["**"],
    "exclude": ["README.md", "cdk*.json", "**/*.d.ts", "**/*.js", "tsconfig.json", "package*.json", "dist"]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

- [ ] **Step 5: Write cdk/lib/static-site-stack.ts**

Copied verbatim from 1nessAgency, renamed:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface StaticSiteStackProps extends cdk.StackProps {
  domainName: string;
}

export class StaticSiteStack extends cdk.Stack {
  public readonly distributionId: string;
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, props: StaticSiteStackProps) {
    super(scope, id, props);
    const { domainName } = props;

    // ── S3 Bucket ──────────────────────────────────────────────────────
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `${domainName}-site`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── CloudFront OAC ─────────────────────────────────────────────────
    const oac = new cloudfront.CfnOriginAccessControl(this, 'OAC', {
      originAccessControlConfig: {
        name: `${domainName}-oac`,
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });

    // ── SPA routing function ───────────────────────────────────────────
    const cfFunction = new cloudfront.Function(this, 'SPARoutingFn', {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.includes('.')) {
    request.uri = uri + '/index.html';
  }
  return request;
}
      `.trim()),
    });

    // ── ACM Certificate (us-east-1, required for CloudFront) ───────────
    // NOTE: Certificate ARN must be passed after manual DNS validation.
    // On first deploy, skip certificate by not passing it.
    // After DNS CNAME records are validated, pass the ARN via context.
    const certificateArn = this.node.tryGetContext('certificateArn');
    const certificate = certificateArn
      ? acm.Certificate.fromCertificateArn(this, 'Cert', certificateArn)
      : undefined;

    // ── CloudFront Distribution ────────────────────────────────────────
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [
          {
            function: cfFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 404, responsePagePath: '/404.html', responseHttpStatus: 404, ttl: cdk.Duration.minutes(5) },
        { httpStatus: 403, responsePagePath: '/404.html', responseHttpStatus: 404, ttl: cdk.Duration.minutes(5) },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      ...(certificate
        ? { domainNames: [domainName, `www.${domainName}`], certificate }
        : {}),
    });

    // Grant CloudFront OAC access to bucket
    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [siteBucket.arnForObjects('*')],
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
        },
      },
    }));

    this.distributionId = distribution.distributionId;
    this.bucketName = siteBucket.bucketName;

    // ── Outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
    new cdk.CfnOutput(this, 'DistributionDomainName', { value: distribution.distributionDomainName });
    new cdk.CfnOutput(this, 'BucketName', { value: siteBucket.bucketName });
  }
}
```

- [ ] **Step 6: Write cdk/bin/app.ts**

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StaticSiteStack } from '../lib/static-site-stack';

const app = new cdk.App();

new StaticSiteStack(app, 'JamesTannahillSiteStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  domainName: 'jamestannahill.com',
});
```

- [ ] **Step 7: Bootstrap and deploy (no certificate yet)**

```bash
cd ~/jamestannahill-com/cdk
npm install
npx cdk bootstrap
npx cdk deploy --all --require-approval never
```
Expected output: Stack deployed. Note the `DistributionDomainName` output (e.g. `xxxx.cloudfront.net`).

- [ ] **Step 8: Upload initial build to S3**

```bash
cd ~/jamestannahill-com
npm run build
aws s3 sync dist/ s3://jamestannahill.com-site/ --delete
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths "/*"
```

- [ ] **Step 9: Verify site loads at CloudFront URL**

Open the `DistributionDomainName` URL in browser. Confirm home page, FAQs, 404 work.

- [ ] **Step 10: Commit**

```bash
cd ~/jamestannahill-com
git add -A
git commit -m "feat: CDK stack — S3 + CloudFront OAC"
```

---

## Task 7: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Add AWS credentials to GitHub Secrets**

In GitHub repo → Settings → Secrets → Actions, add:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `CLOUDFRONT_DISTRIBUTION_ID` (from CDK output)
- `S3_BUCKET` = `jamestannahill.com-site`

- [ ] **Step 2: Write .github/workflows/deploy.yml**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Sync to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-east-1
        run: |
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }}/ --delete

      - name: Invalidate CloudFront
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-east-1
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

- [ ] **Step 3: Push to GitHub and verify action runs**

```bash
cd ~/jamestannahill-com
git add -A
git commit -m "ci: GitHub Actions deploy to S3 + CloudFront"
gh repo create jtannahill/jamestannahill-com --private --source=. --push
```

Check GitHub Actions tab — confirm deploy job passes.

---

## Task 8: SSL Certificate + DNS Cutover (Cloudflare)

> **Do this last — it takes the site live and cuts over from Wix.**
> DNS for `jamestannahill.com` is managed in Cloudflare (existing zone with map/contact/fonts subdomains). Do NOT touch those subdomain records.
> **Important:** Set Cloudflare proxy to **DNS only** (grey cloud) for the CloudFront records — do not proxy CloudFront through Cloudflare (double-CDN causes issues).

- [ ] **Step 1: Request ACM certificate (us-east-1)**

```bash
aws acm request-certificate \
  --domain-name jamestannahill.com \
  --subject-alternative-names www.jamestannahill.com \
  --validation-method DNS \
  --region us-east-1
```
Note the certificate ARN from output.

- [ ] **Step 2: Get DNS validation CNAME records**

```bash
aws acm describe-certificate \
  --certificate-arn <CERT_ARN> \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions[].ResourceRecord'
```
This returns two CNAME records (name + value). Add both to Cloudflare:
- Cloudflare Dashboard → `jamestannahill.com` zone → DNS → Add record
- Type: CNAME, Name: `<name from output>`, Target: `<value from output>`, Proxy: **DNS only (grey cloud)**

- [ ] **Step 3: Wait for ACM validation**

```bash
aws acm wait certificate-validated \
  --certificate-arn <CERT_ARN> \
  --region us-east-1
```
Usually 2–10 minutes after Cloudflare CNAME records are saved.

- [ ] **Step 4: Redeploy CDK with certificate**

```bash
cd ~/jamestannahill-com/cdk
npx cdk deploy --all \
  --context certificateArn=<CERT_ARN> \
  --require-approval never
```
This attaches the cert to CloudFront and adds `jamestannahill.com` + `www.jamestannahill.com` as aliases.

- [ ] **Step 5: Update Cloudflare DNS to point apex + www at CloudFront**

In Cloudflare Dashboard → `jamestannahill.com` zone → DNS:

Update (or add) the apex `@` record:
- Type: CNAME, Name: `@`, Target: `<xxxx.cloudfront.net>`, Proxy: **DNS only (grey cloud)**

Update (or add) the `www` record:
- Type: CNAME, Name: `www`, Target: `<xxxx.cloudfront.net>`, Proxy: **DNS only (grey cloud)**

> The existing Wix A/CNAME records for `@` and `www` will be replaced. All other subdomains (map, contact, fonts) are untouched.

DNS propagation: near-instant with Cloudflare.

- [ ] **Step 6: Verify live site**

```bash
curl -I https://www.jamestannahill.com
```
Expected: `HTTP/2 200` with `x-cache: Hit from cloudfront` on second request.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "docs: Cloudflare DNS cutover complete"
```

---

## Post-Launch

- [ ] Submit sitemap to Google Search Console: `https://www.jamestannahill.com/sitemap-index.xml`
- [ ] Verify all schema markup at https://search.google.com/test/rich-results
- [ ] Add Formspree endpoint (replace `YOUR_FORMSPREE_ID` in ContactForm.astro)
- [ ] Take down Wix site (or keep on a different subdomain for reference)
