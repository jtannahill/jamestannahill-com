# Design Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the visual design of jamestannahill.com — dark hero with NYC nightscape photo, amber accent system, cinematic load animations, scroll reveals, headshot, RDLB video reel, contact page video background, and SES contact form.

**Architecture:** All frontend changes are in-place edits to existing Astro components at `~/jamestannahill-com/src/`. A new `ScrollReveal.astro` component handles IntersectionObserver. SES Lambda is a new CDK stack alongside the existing `JamesTannahillSiteStack`. Videos and photos are uploaded directly to S3 (not in repo).

**Tech Stack:** Astro 6, Tailwind CSS 4, CSS custom properties, IntersectionObserver API, AWS CDK v2, Python Lambda, SES, API Gateway HTTP API

---

## Existing files being modified

- `src/styles/global.css` — add amber tokens, animation keyframes, scroll-reveal base styles
- `src/components/Header.astro` — dark bg, mobile full-screen overlay
- `src/components/Hero.astro` — photo bg, overlay, blur-fade animation
- `src/components/BioSection.astro` — two-column with headshot, amber labels
- `src/components/VenturesSection.astro` — amber hover, scroll reveal
- `src/components/ContactForm.astro` — SES fetch, amber focus, inline success/error
- `src/components/FAQAccordion.astro` — amber open state
- `src/components/Footer.astro` — dark bg to match reel above it
- `src/pages/index.astro` — add RDLBReel and ScrollReveal
- `src/pages/faqs.astro` — add video background

## New files being created

- `src/components/ScrollReveal.astro` — IntersectionObserver wrapper component
- `src/components/RDLBReel.astro` — full-width dark video section
- `public/hero-bg.jpg` — nightscape photo (copied from Photos Library)
- `public/headshot.jpg` — blue suit headshot (copied from Photos Library)
- `public/favicon.svg` — JT monogram SVG
- `scripts/gen-favicon.ts` — generates favicon-32.png + apple-touch-icon.png using sharp
- `cdk/lib/contact-stack.ts` — SES Lambda + API Gateway CDK stack
- `cdk/lambda/contact/handler.py` — Python Lambda handler

---

## Task 1: Copy photos and add amber tokens to global.css

**Files:**
- Modify: `src/styles/global.css`
- Create: `public/hero-bg.jpg`
- Create: `public/headshot.jpg`

- [ ] **Step 1: Copy photos into public/**

```bash
cp "/Users/jamest/Pictures/Photos Library.photoslibrary/resources/derivatives/9/9DC1D3B5-854B-429E-AB33-684B3BE42F41_1_105_c.jpeg" \
  ~/jamestannahill-com/public/hero-bg.jpg

cp "/Users/jamest/Pictures/Photos Library.photoslibrary/resources/derivatives/3/345047AA-91FD-458F-A4C4-C284EEADCE53_1_105_c.jpeg" \
  ~/jamestannahill-com/public/headshot.jpg
```

- [ ] **Step 2: Update `src/styles/global.css`**

Replace entire file with:

```css
@import "tailwindcss";

:root {
  --color-ink: #0a0a0a;
  --color-muted: #6b7280;
  --color-accent: #1a1a1a;
  --color-surface: #f9f9f8;
  --color-border: #e5e5e5;
  --color-amber: #c9882a;
  --color-amber-dark: #b5771f;
  --color-amber-subtle: rgba(201, 136, 42, 0.15);
}

html {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: var(--color-ink);
  background: #fff;
  -webkit-font-smoothing: antialiased;
}

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

/* ── Blur-fade animation (hero load) ── */
@keyframes blurIn {
  from {
    filter: blur(10px);
    opacity: 0;
    transform: scale(1.02);
  }
  to {
    filter: blur(0);
    opacity: 1;
    transform: scale(1);
  }
}

/* ── Scroll reveal base state ── */
.sr {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.sr.visible {
  opacity: 1;
  transform: translateY(0);
}
```

- [ ] **Step 3: Verify build**

```bash
cd ~/jamestannahill-com && npm run build
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd ~/jamestannahill-com
git add -A
git commit -m "feat: add amber tokens, blurIn keyframe, SR base styles, hero+headshot photos"
```

---

## Task 2: Header — dark background, mobile full-screen overlay

**Files:**
- Modify: `src/components/Header.astro`

- [ ] **Step 1: Replace `src/components/Header.astro`**

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
<header class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/[0.06]">
  <div class="max-w-6xl mx-auto px-6 h-13 flex items-center justify-between">
    <a href="/" class="text-xs font-bold tracking-widest uppercase text-white"
       style="font-family:'NHG Display',sans-serif;">
      James Tannahill
    </a>
    <nav class="hidden md:flex items-center gap-8">
      {navLinks.map(link => (
        <a
          href={link.href}
          target={link.external ? '_blank' : undefined}
          rel={link.external ? 'noopener noreferrer' : undefined}
          class={`text-[9px] tracking-[0.18em] uppercase transition-colors ${
            link.label === 'CONTACT'
              ? 'text-[var(--color-amber)] hover:text-[var(--color-amber-dark)]'
              : 'text-white/40 hover:text-white'
          }`}
        >
          {link.label}
        </a>
      ))}
    </nav>
    <button id="menu-toggle" class="md:hidden p-2 text-white" aria-label="Toggle menu">
      <span class="block w-5 h-px bg-current mb-1.5"></span>
      <span class="block w-5 h-px bg-current mb-1.5"></span>
      <span class="block w-5 h-px bg-current"></span>
    </button>
  </div>
</header>

<!-- Mobile full-screen overlay -->
<div id="mobile-menu"
     class="fixed inset-0 z-40 bg-black/95 flex flex-col items-center justify-center gap-8 hidden md:hidden">
  {navLinks.map(link => (
    <a
      href={link.href}
      target={link.external ? '_blank' : undefined}
      rel={link.external ? 'noopener noreferrer' : undefined}
      class={`text-sm tracking-[0.2em] uppercase min-h-[48px] flex items-center transition-colors ${
        link.label === 'CONTACT'
          ? 'text-[var(--color-amber)]'
          : 'text-white/60 hover:text-white'
      }`}
    >
      {link.label}
    </a>
  ))}
</div>

<script>
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  toggle?.addEventListener('click', () => {
    menu?.classList.toggle('hidden');
    document.body.classList.toggle('overflow-hidden');
  });
  // Close on link click
  menu?.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      menu.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    })
  );
</script>
```

- [ ] **Step 2: Verify build**

```bash
cd ~/jamestannahill-com && npm run build
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: header — dark bg, amber CONTACT, mobile full-screen overlay"
```

---

## Task 3: Hero — nightscape photo, overlay, blur-fade animation

**Files:**
- Modify: `src/components/Hero.astro`

- [ ] **Step 1: Replace `src/components/Hero.astro`**

```astro
---
---
<section class="relative min-h-screen flex flex-col justify-end pb-20 px-14 overflow-hidden">
  <!-- Background photo -->
  <div class="absolute inset-0 z-0">
    <img
      src="/hero-bg.jpg"
      alt=""
      class="w-full h-full object-cover object-center"
      style="filter: brightness(0.75);"
      loading="eager"
      fetchpriority="high"
    />
    <!-- Gradient overlay -->
    <div class="absolute inset-0"
         style="background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.82) 100%);"></div>
  </div>

  <!-- Content -->
  <div class="relative z-10 max-w-3xl">
    <p class="text-[10px] tracking-[0.3em] uppercase mb-5"
       style="color:rgba(255,255,255,0.3); animation: blurIn 0.8s ease both; animation-delay: 0.1s;">
      NYC — Private Equity
    </p>
    <h1 class="font-bold leading-none tracking-[-0.03em] text-white mb-6"
        style="font-family:'NHG Display',sans-serif; font-size:clamp(52px,9vw,96px); animation: blurIn 1.1s ease both; animation-delay: 0.35s;">
      Operator.<br/>Investor.<br/>Builder.
    </h1>
    <p class="text-[15px] leading-[1.75] max-w-lg mb-10"
       style="color:rgba(255,255,255,0.42); animation: blurIn 0.9s ease both; animation-delay: 0.65s;">
      Turning proprietary AI, brand infrastructure, and data systems into compounding enterprise value.
    </p>
    <div class="flex gap-3 flex-wrap"
         style="animation: blurIn 0.8s ease both; animation-delay: 0.9s;">
      <a href="/faqs"
         class="inline-block px-8 py-3 text-[10px] tracking-[0.18em] uppercase text-white transition-colors"
         style="background:var(--color-amber);">
        Get in Touch
      </a>
      <a href="https://plocamium.com" target="_blank" rel="noopener noreferrer"
         class="inline-block px-8 py-3 text-[10px] tracking-[0.18em] uppercase transition-colors"
         style="border:1px solid rgba(201,136,42,0.45); color:rgba(201,136,42,0.85);">
        Plocamium Holdings
      </a>
    </div>
  </div>

  <!-- Scroll indicator -->
  <div class="absolute bottom-8 right-14 z-10 flex items-center gap-3"
       style="animation: blurIn 0.8s ease both; animation-delay: 1.1s;">
    <div style="width:1px; height:36px; background:linear-gradient(to bottom, transparent, rgba(201,136,42,0.5));"></div>
    <span class="text-[8px] tracking-[0.25em] uppercase" style="color:rgba(255,255,255,0.2);">Scroll</span>
  </div>
</section>
```

- [ ] **Step 2: Verify dev server**

```bash
cd ~/jamestannahill-com && npm run dev
```
Open http://localhost:4321 — confirm nightscape photo loads, blur-fade animation plays, amber CTAs visible.

- [ ] **Step 3: Commit**

```bash
cd ~/jamestannahill-com
git add -A
git commit -m "feat: hero — nightscape photo, gradient overlay, blur-fade animation, amber CTAs"
```

---

## Task 4: ScrollReveal component

**Files:**
- Create: `src/components/ScrollReveal.astro`

- [ ] **Step 1: Create `src/components/ScrollReveal.astro`**

```astro
---
interface Props {
  /** Extra delay in ms before this element starts its reveal */
  delay?: number;
  /** CSS class(es) to add to the wrapper div */
  class?: string;
}
const { delay = 0, class: className = '' } = Astro.props;
---
<div class={`sr ${className}`} style={delay ? `transition-delay: ${delay}ms` : ''}>
  <slot />
</div>

<script>
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.sr').forEach((el) => observer.observe(el));
</script>
```

- [ ] **Step 2: Verify build**

```bash
cd ~/jamestannahill-com && npm run build
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: ScrollReveal component — IntersectionObserver fade-up"
```

---

## Task 5: BioSection — two-column layout with headshot

**Files:**
- Modify: `src/components/BioSection.astro`

- [ ] **Step 1: Replace `src/components/BioSection.astro`**

```astro
---
const competencies = [
  { title: 'Capital & Financial Architecture', body: 'Strategic finance, capital deployment, investment structuring, M&A advisory.' },
  { title: 'Applied Intelligence', body: 'AI systems architecture, ML pipelines, intelligent automation, data infrastructure.' },
  { title: 'Operational Engineering', body: 'Post-transaction integration, organizational architecture, operational transformation.' },
  { title: 'Brand & Market Positioning', body: 'Brand architecture, narrative positioning, market differentiation.' },
  { title: 'Regulatory & Data Systems', body: 'Regulatory-compliant growth systems, digital infrastructure, data systems.' },
  { title: 'Leadership & Decision Design', body: 'Decision design, leadership frameworks, organizational operating models.' },
];
---
<section class="sr bg-white">
  <div class="max-w-6xl mx-auto px-14 py-24 grid gap-20" style="grid-template-columns: 1fr 380px;">
    <!-- Left: text -->
    <div>
      <p class="text-[9px] tracking-[0.25em] uppercase mb-7" style="color:var(--color-amber);">The Work</p>
      <p class="text-[15px] leading-[1.85] mb-5" style="color:#444;">
        James Tannahill works at the intersection of complex systems: biological, financial, digital, operational.
        His discipline is engineering resilience — structures built to absorb pressure and compound advantage.
      </p>
      <p class="text-[15px] leading-[1.85] mb-5" style="color:#444;">
        He operates across healthcare, industrials, technology, and finance. His background spans biochemistry,
        biotechnology, equity research, strategic finance, and private equity operations.
      </p>
      <p class="text-[15px] leading-[1.85]" style="color:#444;">
        Cornell's Johnson School of Management sharpened his strategic discipline. Today he leads Plocamium Holdings,
        operates through 1nessAgency and RDLB, and builds AI-native products that compound across decades.
      </p>
      <div class="mt-9 space-y-5">
        <div>
          <p class="text-[9px] tracking-[0.2em] uppercase mb-2" style="color:var(--color-amber);">Education</p>
          <p class="text-[12px] leading-[2]" style="color:#888;">
            MBA, Finance &amp; Strategy — Cornell University, Johnson School of Management (2024)<br/>
            M.S., Biotechnology — University of Essex<br/>
            B.S., Biochemistry — Denison University (2015)
          </p>
        </div>
        <div>
          <p class="text-[9px] tracking-[0.2em] uppercase mb-2" style="color:var(--color-amber);">Memberships</p>
          <p class="text-[12px] leading-[2]" style="color:#888;">
            Young Presidents' Organization (YPO)<br/>
            The Economic Club of New York
          </p>
        </div>
      </div>
    </div>
    <!-- Right: headshot -->
    <div class="relative self-start">
      <img
        src="/headshot.jpg"
        alt="James Tannahill"
        class="w-full block"
        style="aspect-ratio:3/4; object-fit:cover; object-position:center top;"
        loading="lazy"
      />
      <div class="absolute bottom-0 left-0 right-0 h-[3px]" style="background:var(--color-amber);"></div>
    </div>
  </div>
</section>
```

Note: the `sr` class on `<section>` means the whole bio fades up on scroll via the ScrollReveal observer.

- [ ] **Step 2: Update `src/pages/index.astro`** to import and use ScrollReveal:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import BioSection from '../components/BioSection.astro';
import CompetenciesSection from '../components/CompetenciesSection.astro';
import VenturesSection from '../components/VenturesSection.astro';
import RDLBReel from '../components/RDLBReel.astro';
---
<BaseLayout
  title="James Tannahill — Private Equity Operator & Multi-Venture Founder"
  description="NYC-based private equity executive, multi-venture founder, and strategic investor. President of Plocamium Holdings. Co-Founder of 1nessAgency and HLTHvrs."
  canonical="https://www.jamestannahill.com"
>
  <Hero />
  <BioSection />
  <CompetenciesSection />
  <VenturesSection />
  <RDLBReel />
</BaseLayout>
```

Note: CompetenciesSection is split out from BioSection in Task 6. RDLBReel is created in Task 7.

- [ ] **Step 3: Verify build**

```bash
cd ~/jamestannahill-com && npm run build
```
Expected: build fails with "Cannot find module CompetenciesSection / RDLBReel" — that's fine, they're created in Tasks 6 and 7. If you want a passing build now, keep the old index.astro and update it after Task 7.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: bio section — two-column headshot layout, amber labels"
```

---

## Task 6: CompetenciesSection and VenturesSection — amber styling + scroll reveal

**Files:**
- Create: `src/components/CompetenciesSection.astro`
- Modify: `src/components/VenturesSection.astro`

- [ ] **Step 1: Create `src/components/CompetenciesSection.astro`**

```astro
---
const competencies = [
  { title: 'Capital & Financial Architecture', body: 'Strategic finance, capital deployment, investment structuring, M&A advisory.' },
  { title: 'Applied Intelligence', body: 'AI systems architecture, ML pipelines, intelligent automation, data infrastructure.' },
  { title: 'Operational Engineering', body: 'Post-transaction integration, organizational architecture, operational transformation.' },
  { title: 'Brand & Market Positioning', body: 'Brand architecture, narrative positioning, market differentiation.' },
  { title: 'Regulatory & Data Systems', body: 'Regulatory-compliant growth systems, digital infrastructure, data systems.' },
  { title: 'Leadership & Decision Design', body: 'Decision design, leadership frameworks, organizational operating models.' },
];
---
<section class="border-t border-[var(--color-border)] bg-white">
  <div class="max-w-6xl mx-auto px-14 py-16">
    <p class="text-[9px] tracking-[0.25em] uppercase mb-10" style="color:var(--color-amber);">Competencies</p>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--color-border)]">
      {competencies.map((c, i) => (
        <div
          class="sr bg-white p-7"
          style={`border-top: 2px solid var(--color-amber); transition-delay: ${i * 80}ms;`}
        >
          <p class="text-[11px] font-semibold mb-2" style="font-family:'NHG Display',sans-serif;">{c.title}</p>
          <p class="text-[11px] leading-[1.7]" style="color:#999;">{c.body}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Replace `src/components/VenturesSection.astro`**

```astro
---
const ventures = [
  { name: 'Plocamium Holdings', description: 'Hybrid investment and operational advisory. 80% advisory-led, 20% direct balance sheet. Targets enterprises valued $10M–$500M.', url: 'https://plocamium.com' },
  { name: '1nessAgency', description: 'Compliance-focused digital marketing for regulated industries. Built for healthcare.', url: 'https://www.1nessagency.com/' },
  { name: 'RDLB', description: 'Global brand strategy and communications for institutional capital markets.', url: 'https://www.rdlb.nyc/' },
  { name: 'HLTHvrs', description: 'HIPAA-conscious marketing intelligence platform for behavioral health, psychiatric, and wellness practices.', url: 'https://hlthvrs.com/' },
  { name: 'MonkeyThorn Meet', description: 'Privacy-first, browser-based video conferencing with end-to-end AES-GCM encryption.', url: null },
  { name: 'gOOOvy', description: 'Auto-reply service for Google Voice texts with scheduled out-of-office responses.', url: 'https://gooovy.com' },
  { name: 'HMU API', description: 'Programmable communication gateway replacing traditional email with structured API endpoints.', url: 'https://hmuapi.com' },
  { name: 'NewYorkLab', description: 'Data-driven environmental intelligence platform quantifying climate-related risks in urban areas.', url: 'https://newyorklab.co/' },
];
---
<section class="border-t border-[var(--color-border)] bg-white">
  <div class="max-w-6xl mx-auto px-14 py-16">
    <p class="text-[9px] tracking-[0.25em] uppercase mb-10" style="color:var(--color-amber);">Ventures & Platforms</p>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)]">
      {ventures.map((v, i) => (
        <div
          class="sr bg-white p-6 flex flex-col group"
          style={`border-top: 2px solid transparent; transition-delay: ${i * 60}ms; transition-property: opacity, transform, border-top-color;`}
          onmouseenter="this.style.borderTopColor='var(--color-amber)'"
          onmouseleave="this.style.borderTopColor='transparent'"
        >
          <p class="text-[11px] font-semibold mb-2" style="font-family:'NHG Display',sans-serif;">{v.name}</p>
          <p class="text-[10px] leading-[1.7] flex-1" style="color:#aaa;">{v.description}</p>
          {v.url && (
            <a href={v.url} target="_blank" rel="noopener noreferrer"
               class="mt-4 text-[9px] tracking-[0.15em] uppercase"
               style="color:var(--color-amber);">
              Visit →
            </a>
          )}
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 3: Verify build**

```bash
cd ~/jamestannahill-com && npm run build
```
Expected: no errors (index.astro still needs updating if not done in Task 5).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: competencies + ventures — amber borders, scroll reveal, hover treatment"
```

---

## Task 7: RDLBReel component + video upload + index.astro wiring

**Files:**
- Create: `src/components/RDLBReel.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Upload RDLB video to S3**

```bash
aws s3 cp "/Users/jamest/Downloads/RDLB Brand Equity Capsule.mp4" \
  s3://jamestannahill.com-site/videos/RDLB-brand-reel.mp4 \
  --content-type video/mp4 \
  --cache-control "public, max-age=31536000"
```
Expected: upload completes (~210MB, may take a few minutes).

- [ ] **Step 2: Create `src/components/RDLBReel.astro`**

```astro
---
const videoUrl = 'https://d9ttkh3tz30f6.cloudfront.net/videos/RDLB-brand-reel.mp4';
---
<section style="background:#000; border-top: 1px solid rgba(201,136,42,0.2); border-bottom: 1px solid rgba(201,136,42,0.2);">
  <video
    src={videoUrl}
    autoplay
    muted
    loop
    playsinline
    class="w-full block"
    style="max-height: 80vh; object-fit: cover;"
  />
</section>
```

- [ ] **Step 3: Update `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import BioSection from '../components/BioSection.astro';
import CompetenciesSection from '../components/CompetenciesSection.astro';
import VenturesSection from '../components/VenturesSection.astro';
import RDLBReel from '../components/RDLBReel.astro';
---
<BaseLayout
  title="James Tannahill — Private Equity Operator & Multi-Venture Founder"
  description="NYC-based private equity executive, multi-venture founder, and strategic investor. President of Plocamium Holdings. Co-Founder of 1nessAgency and HLTHvrs."
  canonical="https://www.jamestannahill.com"
>
  <Hero />
  <BioSection />
  <CompetenciesSection />
  <VenturesSection />
  <RDLBReel />
</BaseLayout>
```

- [ ] **Step 4: Verify build**

```bash
cd ~/jamestannahill-com && npm run build
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: RDLB brand reel section — full-width dark video, amber border, above footer"
```

---

## Task 8: FAQs page — video background, amber form, accordion

**Files:**
- Modify: `src/components/ContactForm.astro`
- Modify: `src/components/FAQAccordion.astro`
- Modify: `src/pages/faqs.astro`

- [ ] **Step 1: Transcode IMG_0154.mov to MP4**

```bash
ffmpeg -i "/Users/jamest/Downloads/IMG_0154.mov" \
  -c:v libx264 -crf 23 -preset slow \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  /tmp/contact-bg.mp4
```
If ffmpeg is not installed: `brew install ffmpeg`

- [ ] **Step 2: Upload contact background video to S3**

```bash
aws s3 cp /tmp/contact-bg.mp4 \
  s3://jamestannahill.com-site/videos/contact-bg.mp4 \
  --content-type video/mp4 \
  --cache-control "public, max-age=31536000"
```

- [ ] **Step 3: Replace `src/components/ContactForm.astro`**

```astro
---
---
<div class="max-w-2xl">
  <h2 class="text-2xl font-bold mb-2" style="font-family:'NHG Display',sans-serif;">Get in Touch</h2>
  <p class="text-sm mb-8" style="color:var(--color-muted);">
    Or email directly:
    <a href="mailto:web@jamestannahill.com" class="underline">web@jamestannahill.com</a>
  </p>
  <form id="contact-form" class="space-y-4">
    <div class="grid sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-[10px] uppercase tracking-wider mb-1" for="firstName">First Name</label>
        <input id="firstName" name="firstName" type="text" required
               class="w-full border border-[var(--color-border)] px-4 py-3 text-sm bg-white/80 focus:outline-none focus:border-[var(--color-amber)]" />
      </div>
      <div>
        <label class="block text-[10px] uppercase tracking-wider mb-1" for="lastName">Last Name</label>
        <input id="lastName" name="lastName" type="text" required
               class="w-full border border-[var(--color-border)] px-4 py-3 text-sm bg-white/80 focus:outline-none focus:border-[var(--color-amber)]" />
      </div>
    </div>
    <div>
      <label class="block text-[10px] uppercase tracking-wider mb-1" for="email">Email</label>
      <input id="email" name="email" type="email" required
             class="w-full border border-[var(--color-border)] px-4 py-3 text-sm bg-white/80 focus:outline-none focus:border-[var(--color-amber)]" />
    </div>
    <div>
      <label class="block text-[10px] uppercase tracking-wider mb-1" for="phone">Phone</label>
      <input id="phone" name="phone" type="tel"
             class="w-full border border-[var(--color-border)] px-4 py-3 text-sm bg-white/80 focus:outline-none focus:border-[var(--color-amber)]" />
    </div>
    <div>
      <label class="block text-[10px] uppercase tracking-wider mb-1" for="subject">Subject</label>
      <input id="subject" name="subject" type="text" required
             class="w-full border border-[var(--color-border)] px-4 py-3 text-sm bg-white/80 focus:outline-none focus:border-[var(--color-amber)]" />
    </div>
    <div>
      <label class="block text-[10px] uppercase tracking-wider mb-1" for="message">Message</label>
      <textarea id="message" name="message" rows="5" required
                class="w-full border border-[var(--color-border)] px-4 py-3 text-sm bg-white/80 focus:outline-none focus:border-[var(--color-amber)] resize-none"></textarea>
    </div>
    <button type="submit" id="contact-submit"
            class="px-8 py-3 text-white text-[10px] tracking-[0.18em] uppercase transition-colors"
            style="background:var(--color-amber);">
      Send Message
    </button>
    <p id="contact-success" class="hidden text-sm" style="color:var(--color-amber);">
      ✓ Message sent. I'll be in touch.
    </p>
    <p id="contact-error" class="hidden text-sm text-red-500">
      Something went wrong. Please email web@jamestannahill.com directly.
    </p>
  </form>
</div>

<script>
  const form = document.getElementById('contact-form') as HTMLFormElement;
  const btn = document.getElementById('contact-submit') as HTMLButtonElement;
  const success = document.getElementById('contact-success')!;
  const error = document.getElementById('contact-error')!;

  // CONTACT_API_URL is replaced at build time — set it after Task 9 deploys the Lambda
  const API_URL = 'CONTACT_API_URL_PLACEHOLDER';

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.textContent = 'Sending...';
    btn.disabled = true;
    success.classList.add('hidden');
    error.classList.add('hidden');

    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Non-2xx');
      form.reset();
      success.classList.remove('hidden');
    } catch {
      error.classList.remove('hidden');
    } finally {
      btn.textContent = 'Send Message';
      btn.disabled = false;
    }
  });
</script>
```

- [ ] **Step 4: Replace `src/components/FAQAccordion.astro`**

```astro
---
const faqs = [
  { q: 'How does value engineering differ from investment banking or management consulting?', a: 'Investment bankers optimize the transaction — find buyers, structure deals, negotiate terms. Management consultants diagnose problems and recommend frameworks. Value engineering executes the specific changes that make a business worth more before bankers take it to market. We don\'t write slide decks about what you should do. We build the revenue engines, data infrastructure, and growth systems that directly increase what a buyer is willing to pay.' },
  { q: 'What levers actually move valuation before a transaction?', a: 'Focus on metrics driving buyer multiples: recurring revenue mix, customer acquisition cost efficiency, gross margin expansion, reduction of key-person risk. A typical engagement builds scalable digital acquisition channels, performance attribution systems, and pricing restructures for predictable growth. Companies showing 12–18 months of engineered growth command 2–4x higher multiples than flat or founder-dependent revenue.' },
  { q: 'How do you engineer a premium exit multiple?', a: 'It goes beyond clean financials. Build diversified revenue streams not dependent on one client or channel, documented customer acquisition systems, real-time performance dashboards, and an independent management team. Stress-test against PE due diligence frameworks before negotiation begins.' },
  { q: 'What profile of company is the best fit?', a: 'Founder-led and PE-backed companies in the $5M–$100M revenue range, 12–36 months from transaction. Healthcare services, SaaS, professional services, industrials, regulated technology — where digital growth strategy and data infrastructure have outsized valuation impact.' },
  { q: 'Where does applied AI create real leverage in private equity?', a: 'Three areas: (1) Customer acquisition — AI-driven attribution identifies highest-LTV customers, reallocating spend in real time. (2) Operational efficiency — Automate reporting, detect anomalies, surface wasted budget. (3) Competitive intelligence — AI-powered market analysis benchmarks digital presence and identifies whitespace opportunities.' },
  { q: 'What does the first conversation look like?', a: 'A confidential diagnostic conversation about your business model, transaction timeline, and valuation levers. If the fit exists, we propose a scoped engagement with clear KPIs and a measurable impact target. No obligation, no generic pitch — every engagement is structured around what will actually move your multiple.' },
];
---
<div class="mt-16 border-t border-[var(--color-border)] pt-12">
  <h2 class="text-[9px] tracking-[0.25em] uppercase mb-8" style="color:var(--color-amber);">Frequently Asked</h2>
  <div class="divide-y divide-[var(--color-border)]">
    {faqs.map((faq) => (
      <details class="group py-5">
        <summary class="flex justify-between items-start cursor-pointer list-none gap-4">
          <span class="font-medium text-sm leading-relaxed">{faq.q}</span>
          <span class="mt-0.5 flex-shrink-0 transition-transform group-open:rotate-45"
                style="color:var(--color-amber);">+</span>
        </summary>
        <p class="mt-4 text-sm leading-relaxed max-w-3xl" style="color:var(--color-muted);">{faq.a}</p>
      </details>
    ))}
  </div>
</div>
```

- [ ] **Step 5: Replace `src/pages/faqs.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ContactForm from '../components/ContactForm.astro';
import FAQAccordion from '../components/FAQAccordion.astro';

const videoUrl = 'https://d9ttkh3tz30f6.cloudfront.net/videos/contact-bg.mp4';
---
<BaseLayout
  title="James Tannahill | Contact & Professional Inquiries"
  description="Get in touch with James Tannahill — private equity advisory, value engineering, and strategic partnerships."
  canonical="https://www.jamestannahill.com/faqs"
>
  <!-- Fixed video background -->
  <video
    src={videoUrl}
    autoplay
    muted
    loop
    playsinline
    class="fixed inset-0 w-full h-full object-cover -z-10"
    style="opacity: 0.12;"
  />
  <!-- Dark overlay -->
  <div class="fixed inset-0 bg-black/60 -z-10"></div>

  <div class="relative max-w-6xl mx-auto px-6 py-16">
    <ContactForm />
    <FAQAccordion />
  </div>
</BaseLayout>
```

- [ ] **Step 6: Verify build**

```bash
cd ~/jamestannahill-com && npm run build
```
Expected: no errors. Note: contact form submit will fail until Task 9 deploys the Lambda and you replace `CONTACT_API_URL_PLACEHOLDER`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: FAQs page — video bg, amber form focus/accordion, SES fetch (pending URL)"
```

---

## Task 9: Footer — dark background

**Files:**
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Replace `src/components/Footer.astro`**

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
<footer class="bg-[var(--color-ink)] border-t border-white/[0.06] py-8">
  <div class="max-w-6xl mx-auto px-14 flex flex-col md:flex-row items-center justify-between gap-4">
    <p class="text-[10px]" style="color:#333;">© {year} James Tannahill</p>
    <nav class="flex flex-wrap items-center gap-6">
      {navLinks.map(link => (
        <a
          href={link.href}
          target={link.external ? '_blank' : undefined}
          rel={link.external ? 'noopener noreferrer' : undefined}
          class="text-[9px] tracking-[0.1em] transition-colors hover:text-white"
          style="color:#333;"
        >
          {link.label}
        </a>
      ))}
    </nav>
    <a href="https://www.linkedin.com/in/jamesstannahill/" target="_blank" rel="noopener noreferrer"
       class="transition-colors hover:text-white" style="color:#333;" aria-label="LinkedIn">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    </a>
  </div>
</footer>
```

- [ ] **Step 2: Verify build**

```bash
cd ~/jamestannahill-com && npm run build
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: footer — dark bg to match RDLB reel above"
```

---

## Task 10: SVG Favicon + PNG generation script

**Files:**
- Create: `public/favicon.svg`
- Create: `scripts/gen-favicon.ts`
- Modify: `package.json` (add prebuild step)

- [ ] **Step 1: Create `public/favicon.svg`**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <style>
      @font-face {
        font-family: 'NHG Display';
        src: url('https://fonts.jamestannahill.com/NHGDisplayBold.woff2') format('woff2');
        font-weight: 700;
      }
    </style>
  </defs>
  <rect width="32" height="32" fill="#0a0a0a"/>
  <rect x="4" y="27" width="24" height="2" fill="#c9882a"/>
  <text
    x="16" y="22"
    font-family="'NHG Display', 'Helvetica Neue', sans-serif"
    font-weight="700"
    font-size="14"
    fill="white"
    text-anchor="middle"
    letter-spacing="1"
  >JT</text>
</svg>
```

- [ ] **Step 2: Install resvg for PNG generation**

```bash
cd ~/jamestannahill-com && npm install -D @resvg/resvg-js
```

- [ ] **Step 3: Create `scripts/gen-favicon.ts`**

```typescript
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const svgPath = resolve('public/favicon.svg');
const svgData = readFileSync(svgPath, 'utf-8');

function render(size: number, outPath: string) {
  const resvg = new Resvg(svgData, {
    fitTo: { mode: 'width', value: size },
  });
  const png = resvg.render().asPng();
  writeFileSync(resolve(outPath), png);
  console.log(`Generated ${outPath} (${size}×${size})`);
}

render(32, 'public/favicon-32.png');
render(180, 'public/apple-touch-icon.png');
```

- [ ] **Step 4: Update `package.json` build script**

Change the `build` script from:
```json
"build": "astro build && cp dist/sitemap-index.xml dist/sitemap.xml"
```
To:
```json
"build": "tsx scripts/gen-favicon.ts && astro build && cp dist/sitemap-index.xml dist/sitemap.xml"
```

- [ ] **Step 5: Update `src/components/SEOHead.astro`** — add PNG favicon links after existing favicon line:

Find the existing `<script type="application/ld+json"...` line and add before it:

```astro
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

- [ ] **Step 6: Verify build generates PNGs**

```bash
cd ~/jamestannahill-com && npm run build
```
Expected: `Generated public/favicon-32.png (32×32)` and `Generated public/apple-touch-icon.png (180×180)` printed, then Astro build completes.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: JT favicon — SVG + PNG fallbacks generated at build time"
```

---

## Task 11: SES Lambda CDK stack

**Files:**
- Create: `cdk/lib/contact-stack.ts`
- Create: `cdk/lambda/contact/handler.py`
- Modify: `cdk/bin/app.ts`

- [ ] **Step 1: Verify SES email is verified**

```bash
aws ses get-identity-verification-attributes \
  --identities web@jamestannahill.com \
  --region us-east-1
```
If `VerificationStatus` is not `"Success"`, run:
```bash
aws ses verify-email-identity --email-address web@jamestannahill.com --region us-east-1
```
Then check your inbox and click the verification link before proceeding.

- [ ] **Step 2: Create `cdk/lambda/contact/handler.py`**

```python
import json
import os
import boto3
from botocore.exceptions import ClientError

ses = boto3.client('ses', region_name='us-east-1')
TO_EMAIL = 'web@jamestannahill.com'
FROM_EMAIL = 'web@jamestannahill.com'

def handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': 'https://www.jamestannahill.com',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
    }

    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    try:
        body = json.loads(event.get('body', '{}'))
        first = body.get('firstName', '').strip()
        last = body.get('lastName', '').strip()
        email = body.get('email', '').strip()
        phone = body.get('phone', '').strip()
        subject = body.get('subject', '(no subject)').strip()
        message = body.get('message', '').strip()

        if not first or not email or not message:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'firstName, email, and message are required'}),
            }

        body_text = f"""New contact form submission from jamestannahill.com

Name: {first} {last}
Email: {email}
Phone: {phone or 'not provided'}
Subject: {subject}

Message:
{message}
"""

        ses.send_email(
            Source=FROM_EMAIL,
            Destination={'ToAddresses': [TO_EMAIL]},
            Message={
                'Subject': {'Data': f'[jamestannahill.com] {subject}'},
                'Body': {'Text': {'Data': body_text}},
            },
            ReplyToAddresses=[email],
        )

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True}),
        }

    except ClientError as e:
        print(f'SES error: {e}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to send email'}),
        }
```

- [ ] **Step 3: Create `cdk/lib/contact-stack.ts`**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class ContactStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fn = new lambda.Function(this, 'ContactFn', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('lambda/contact'),
      timeout: cdk.Duration.seconds(15),
    });

    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail'],
      resources: ['*'],
    }));

    const integration = new integrations.HttpLambdaIntegration('ContactIntegration', fn);

    const api = new apigateway.HttpApi(this, 'ContactApi', {
      corsPreflight: {
        allowOrigins: ['https://www.jamestannahill.com'],
        allowMethods: [apigateway.CorsHttpMethod.POST],
        allowHeaders: ['Content-Type'],
      },
    });

    api.addRoutes({
      path: '/contact',
      methods: [apigateway.HttpMethod.POST],
      integration,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `${api.apiEndpoint}/contact`,
      description: 'Contact form API endpoint — paste into ContactForm.astro',
    });
  }
}
```

- [ ] **Step 4: Install API Gateway v2 CDK package**

```bash
cd ~/jamestannahill-com/cdk && npm install @aws-cdk/aws-apigatewayv2-integrations
```

- [ ] **Step 5: Update `cdk/bin/app.ts`**

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StaticSiteStack } from '../lib/static-site-stack';
import { ContactStack } from '../lib/contact-stack';

const app = new cdk.App();

new StaticSiteStack(app, 'JamesTannahillSiteStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  domainName: 'jamestannahill.com',
});

new ContactStack(app, 'JamesTannahillContactStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
});
```

- [ ] **Step 6: Deploy**

```bash
cd ~/jamestannahill-com/cdk
npx cdk deploy JamesTannahillContactStack --require-approval never
```
Expected output includes: `ApiUrl: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/contact`

- [ ] **Step 7: Wire API URL into ContactForm.astro**

In `src/components/ContactForm.astro`, replace:
```typescript
const API_URL = 'CONTACT_API_URL_PLACEHOLDER';
```
With the actual URL from the CDK output, e.g.:
```typescript
const API_URL = 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/contact';
```

- [ ] **Step 8: Test the form end-to-end**

```bash
curl -X POST https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/contact \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","subject":"Test","message":"Hello"}'
```
Expected: `{"success": true}` and email arrives at `web@jamestannahill.com`.

- [ ] **Step 9: Commit**

```bash
cd ~/jamestannahill-com
git add -A
git commit -m "feat: SES Lambda contact form — API Gateway + Python handler, CDK deployed"
```

---

## Task 12: Deploy + S3 sync + CloudFront invalidation

- [ ] **Step 1: Build**

```bash
cd ~/jamestannahill-com && npm run build
```
Expected: favicons generated, 5 routes built, no errors.

- [ ] **Step 2: Sync to S3**

```bash
aws s3 sync dist/ s3://jamestannahill.com-site/ --delete
```

- [ ] **Step 3: Invalidate CloudFront**

```bash
aws cloudfront create-invalidation \
  --distribution-id E1KASWFXCUI8NS \
  --paths "/*"
```

- [ ] **Step 4: Verify live**

```bash
curl -I https://d9ttkh3tz30f6.cloudfront.net/
```
Expected: `HTTP/2 200`

Open in browser and confirm: hero photo loads, blur-fade animation plays, scroll down shows bio with headshot, competency cards reveal, ventures grid, RDLB reel plays at bottom.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: deploy design overhaul to S3 + CloudFront"
```
