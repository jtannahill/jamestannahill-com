# ProSecPR Roster Addition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ProSecPR as a venture across James Tannahill's personal-brand entity graph (Astro site copy, schema.org JSON-LD, llms.txt/llms-full.txt) and the standalone `-llms`/`-schema`/`-map`/`-mirror` repos, consistent with the firm's own site at prosecpr.com.

**Architecture:** Pure content + structured-data edits. No new runtime code. "Tests" here are: the Astro build succeeds (which compiles and thereby validates the inline JSON-LD object), `grep` confirms required strings are present, JSON files `JSON.parse` clean, and a post-deploy visual check of the Ventures grid. Phase 1 = canonical live site (`~/jamestannahill-com`). Phase 2 = sync the standalone entity-graph repos.

**Tech Stack:** Astro 6, `@astrojs/cloudflare` (Worker; `npm run build` → `npx wrangler deploy`), TypeScript front-matter components, plain-text llms files, JSON-LD.

## Global Constraints

- **House style: no em-dashes (—) in any copy.** Use commas, periods, or middots (·). (Verbatim from spec; matches repo commit `1c40444` "strip em-dashes per house style".)
- **Role everywhere:** `Head of Field Operations` (matches prosecpr.com leadership page; Carlos Davila is Founder & CEO). Never "Principal".
- **Canonical URL:** `https://prosecpr.com` (the vercel.app URL is staging — never cite it).
- **Name:** `ProSecPR`; `alternateName` `PROSECPR`. "PR" = Puerto Rico (HQ), conveyed by context, no separate gloss.
- **Slogan:** `American Strength · Regional Intelligence.`
- **Voice:** veteran-led security *advisory* firm. Protective/defensive. NEVER use the dropped "techno-statecraft / vault Venezuela to tier-one / leapfrog to technological sovereignty / frontier innovation base / HUMINT-offensive" framing.
- **Master description** (reuse verbatim where a long description is needed):
  > ProSecPR is a veteran-led security advisory firm uniting the operational discipline of America's defense and national-security community with the cultural intelligence required to operate across Latin America. It protects people, organizations, infrastructure, and strategic interests by integrating four capabilities into one system: strategic intelligence, elite personnel, advanced technology, and continuous protection. Headquartered in Puerto Rico, forward-based in Miami, with a strategic network in Washington, D.C. and on-the-ground intelligence in Venezuela. Security advisory, not security contracting.
- **Commits:** direct commit + push to `main` is approved on these personal repos (no PR flow).

---

## Phase 1 — Canonical live site (`~/jamestannahill-com`)

### Task 1: Ventures grid card

**Files:**
- Modify: `src/components/VenturesSection.astro` (interface ~line 2-9; `ventures` array line 11-68; empty-logo fallback line 113-115)

**Interfaces:**
- Produces: a new `ProSecPR` entry in the `ventures` array; a generalized `logoText` fallback field consumed by the template.

- [ ] **Step 1: Generalize the hardcoded "Art." logo fallback**

In the `interface Venture` block, add an optional field:

```ts
interface Venture {
  name: string;
  description: string;
  url: string;
  logo: string;
  logoH: number;
  logoFill?: boolean;
  logoText?: string;
}
```

In the template, change the hardcoded fallback (currently `<span ...>Art.</span>`) to use `logoText`:

```astro
                ) : (
                  <span style="font-family:'NHG Display',sans-serif; font-size:32px; font-weight:700; letter-spacing:-0.02em; color:#111;">{v.logoText || v.name}</span>
                )}
```

- [ ] **Step 2: Preserve Art Generator's existing "Art." display**

On the `Art Generator` entry (currently `logo: ''`), add `logoText: 'Art.'` so its card is unchanged:

```ts
  {
    name: 'Art Generator',
    description: 'Daily generative art rendered from live atmospheric data. Weather patterns, satellite palettes, and environmental signals converted into original artworks - 11 artists, daily rotation, PNG and print-quality output.',
    url: 'https://art.jamestannahill.com',
    logo: '',
    logoH: 44,
    logoText: 'Art.',
  },
```

- [ ] **Step 3: Add the ProSecPR entry**

Insert as the **second** array element, immediately after the `Plocamium Holdings` object (James can reorder later):

```ts
  {
    name: 'ProSecPR',
    description: 'Veteran-led security advisory firm. Strategic intelligence, elite personnel, advanced technology, and continuous protection across Latin America. American Strength, Regional Intelligence.',
    url: 'https://prosecpr.com',
    logo: '',
    logoH: 44,
    logoText: 'ProSecPR',
  },
```

- [ ] **Step 4: Verify the build compiles**

Run: `cd ~/jamestannahill-com && npm run build`
Expected: build completes with no errors (Astro compiles the component).

- [ ] **Step 5: Verify the card content is present**

Run: `grep -c "ProSecPR" src/components/VenturesSection.astro`
Expected: `2` (the `name` and `logoText`). Also confirm no "techno-statecraft": `grep -ci "techno-statecraft\|leapfrog\|HUMINT" src/components/VenturesSection.astro` → `0`.

- [ ] **Step 6: Commit**

```bash
git add src/components/VenturesSection.astro
git commit -m "Ventures: add ProSecPR card; generalize logo-text fallback"
```

---

### Task 2: Bio prose (top-line)

**Files:**
- Modify: `src/components/BioSection.astro` (the third `<p>`, lines 27-30)

- [ ] **Step 1: Append the ProSecPR sentence to the closing bio paragraph**

Replace the third paragraph's text:

```astro
      <p class="text-[15px] leading-[1.85]" style="color:#444;">
        MBA from Cornell's Johnson School of Management. He leads Plocamium Holdings,
        runs 1NESS Strategies, advises RDLB, and builds AI-native software.
        As Head of Field Operations at ProSecPR, a veteran-led security advisory firm
        headquartered in Puerto Rico, he helps protect people, organizations, and
        strategic interests across Latin America.
      </p>
```

- [ ] **Step 2: Verify (no em-dashes, string present, build)**

Run: `grep -c "Head of Field Operations at ProSecPR" src/components/BioSection.astro` → expect `1`.
Run: `grep -c "—" src/components/BioSection.astro` → expect `0`.
Run: `npm run build` → expect success.

- [ ] **Step 3: Commit**

```bash
git add src/components/BioSection.astro
git commit -m "Bio: add ProSecPR (Head of Field Operations) top-line"
```

---

### Task 3: Schema.org JSON-LD (`SEOHead.astro`)

**Files:**
- Modify: `src/components/SEOHead.astro` (Person node lines 26-57; `@graph` array ends line 75)

**Interfaces:**
- Produces: `#prosecpr` Organization node in the `@graph`; `Person` wired via `worksFor` (inline), `affiliation` (@id ref), `sameAs`, `jobTitle`, `knowsAbout`.

- [ ] **Step 1: Update the Person node**

Apply four edits inside the Person object (lines 26-57):

1. `jobTitle` — append the role:
```ts
      "jobTitle": "President & Managing Partner, Plocamium Holdings; Intelligent Capital, xAI; Head of Field Operations, ProSecPR",
```

2. `worksFor` — add ProSecPR as the final inline entry:
```ts
      "worksFor": [
        { "@type": "Organization", "name": "xAI", "url": "https://x.ai" },
        { "@type": "Organization", "name": "Plocamium Holdings", "url": "https://plocamium.com" },
        { "@type": "Organization", "name": "1NESS Strategies", "url": "https://www.1nessagency.com" },
        { "@type": "Organization", "name": "RDLB", "url": "https://www.rdlb.nyc" },
        { "@type": "Organization", "name": "NewYorkLab", "url": "https://newyorklab.co" },
        { "@type": "Organization", "name": "ProSecPR", "url": "https://prosecpr.com" }
      ],
```

3. Add an `affiliation` key (Person has none today) right after `worksFor`, linking the rich node:
```ts
      "affiliation": [
        { "@id": "https://jamestannahill.com/#prosecpr" }
      ],
```

4. `sameAs` — add the firm domain:
```ts
      "sameAs": [
        "https://www.linkedin.com/in/jamesstannahill/",
        "https://github.com/jtannahill",
        "https://www.bloomberg.com/profile/person/23291921",
        "https://prosecpr.com"
      ],
```

5. `knowsAbout` — append four terms before the closing `]`:
```ts
        "AI Solutions", "AI/ML Solutions",
        "Security Risk Advisory", "Protective Operations", "Strategic Intelligence", "Latin America Risk"
```

- [ ] **Step 2: Add the `#prosecpr` Organization node**

Insert as a new element in the `@graph` array, immediately after the `ProfessionalService` node (after its closing `}` on line 74, before the array-closing `]` on line 75). Add a comma after the ProfessionalService node:

```ts
    {
      "@type": "Organization",
      "@id": "https://jamestannahill.com/#prosecpr",
      "name": "ProSecPR",
      "alternateName": "PROSECPR",
      "url": "https://prosecpr.com",
      "slogan": "American Strength · Regional Intelligence.",
      "description": "ProSecPR is a veteran-led security advisory firm uniting the operational discipline of America's defense and national-security community with the cultural intelligence required to operate across Latin America. It protects people, organizations, infrastructure, and strategic interests by integrating four capabilities into one system: strategic intelligence, elite personnel, advanced technology, and continuous protection. Headquartered in Puerto Rico, forward-based in Miami, with a strategic network in Washington, D.C. and on-the-ground intelligence in Venezuela. Security advisory, not security contracting.",
      "areaServed": ["Puerto Rico", "United States", "Latin America", "Venezuela"],
      "knowsAbout": [
        "Security Risk Advisory",
        "Threat & Vulnerability Assessment",
        "Protective Operations",
        "Strategic Intelligence",
        "Human & Information-Environment Analysis",
        "Crisis Management",
        "Latin America / Venezuela Country Intelligence"
      ],
      "member": { "@id": "https://jamestannahill.com/#person" }
    }
```

- [ ] **Step 3: Verify the build compiles (this validates the JSON-LD)**

Run: `npm run build`
Expected: success. A malformed object (trailing/missing comma) fails the build here.

- [ ] **Step 4: Verify the rendered JSON-LD parses and contains the node**

Run:
```bash
npm run build >/dev/null 2>&1 && \
grep -rl 'application/ld+json' dist/ | head -1 | xargs grep -o '"@id":"https://jamestannahill.com/#prosecpr"' | head -1
```
Expected: prints `"@id":"https://jamestannahill.com/#prosecpr"` (node present in built HTML).

- [ ] **Step 5: Commit**

```bash
git add src/components/SEOHead.astro
git commit -m "Schema: add ProSecPR Organization node + wire Person graph"
```

---

### Task 4: `public/llms.txt`

**Files:**
- Modify: `public/llms.txt` (lead `>` para line 3; Current Roles line 23-26; Ventures line 30-38)

- [ ] **Step 1: Append a ProSecPR sentence to the lead summary**

At the end of the first `>` paragraph (line 3, after "...He founded MonkeyThorn, gOOOvy, HMU API, NewYorkLab, and Art Generator."), add:

```
 He is Head of Field Operations at ProSecPR, a veteran-led security advisory firm headquartered in Puerto Rico, protecting people, organizations, and strategic interests across Latin America.
```

- [ ] **Step 2: Add a Current Roles bullet**

After the RDLB role (line 26), add:

```
- **Head of Field Operations, ProSecPR**, Veteran-led security advisory and regional intelligence across Latin America (HQ Puerto Rico)
```

- [ ] **Step 3: Add a Ventures & Platforms bullet**

Add directly after the Plocamium Holdings bullet (line 30):

```
- [ProSecPR](https://prosecpr.com): Veteran-led security advisory firm. Strategic intelligence, elite personnel, advanced technology, and continuous protection across Latin America. American Strength, Regional Intelligence.
```

- [ ] **Step 4: Verify**

Run: `grep -c "ProSecPR" public/llms.txt` → expect `3`.
Run: `grep -c "—" public/llms.txt` → expect `0`.
Run: `grep -c "prosecpr.com" public/llms.txt` → expect `1`.

- [ ] **Step 5: Commit**

```bash
git add public/llms.txt
git commit -m "llms.txt: add ProSecPR (role, summary, venture)"
```

---

### Task 5: `public/llms-full.txt`

**Files:**
- Modify: `public/llms-full.txt` (header version line 5-7; VENTURES list line 145-155; FAQ block line 158-183)

- [ ] **Step 1: Add ProSecPR to the VENTURES list**

After the Plocamium line (line 147), add:

```
- ProSecPR, prosecpr.com, Veteran-led security advisory and regional intelligence across Latin America; HQ Puerto Rico
```

- [ ] **Step 2: Add a citable FAQ Q&A**

At the end of the FAQ Q&A pairs (after line 183, the "best way to get in touch" answer), add:

```
Q: What is ProSecPR and what is James Tannahill's role?
A: ProSecPR is a veteran-led security advisory firm uniting the operational discipline of America's defense and national-security community with the cultural intelligence required to operate across Latin America. It protects people, organizations, infrastructure, and strategic interests through four integrated capabilities: strategic intelligence, elite personnel, advanced technology, and continuous protection. The firm is headquartered in Puerto Rico, forward-based in Miami, with a strategic network in Washington, D.C. and on-the-ground intelligence in Venezuela. It is security advisory, not security contracting, and is an independent private firm not affiliated with any government or armed forces. James Tannahill serves as Head of Field Operations. Website: https://prosecpr.com.
```

- [ ] **Step 3: Bump the header metadata**

Update the header lines:
```
# Last-Updated: 2026-06-30
# Version: 6.3
```

- [ ] **Step 4: Verify**

Run: `grep -c "ProSecPR" public/llms-full.txt` → expect `>= 3`.
Run: `grep -c "—" public/llms-full.txt` → expect `0`.

- [ ] **Step 5: Commit**

```bash
git add public/llms-full.txt
git commit -m "llms-full.txt: add ProSecPR venture + citable FAQ; bump to v6.3"
```

---

### Task 6: Build, deploy, and verify Phase 1 live

**Files:** none (build + deploy + verification)

- [ ] **Step 1: Clean build**

Run: `cd ~/jamestannahill-com && npm run build`
Expected: success, no errors.

- [ ] **Step 2: Confirm built artifacts contain ProSecPR**

Run:
```bash
grep -rl "ProSecPR" dist/ | head
grep -o '"@id":"https://jamestannahill.com/#prosecpr"' dist/**/*.html 2>/dev/null | head -1
```
Expected: ProSecPR appears in built HTML and the schema `@id` is present.

- [ ] **Step 3: Push and deploy**

```bash
git push origin main
npx wrangler deploy
```
Expected: wrangler reports a successful deploy of `jamestannahill-com`.

- [ ] **Step 4: Verify live endpoints**

Run:
```bash
curl -s https://jamestannahill.com/llms.txt | grep -c "ProSecPR"            # expect >=3
curl -s https://jamestannahill.com/llms-full.txt | grep -c "ProSecPR"       # expect >=3
curl -s https://jamestannahill.com/ | grep -o '#prosecpr' | head -1         # expect "#prosecpr"
```

- [ ] **Step 5: Visual check of the Ventures grid**

Use the browser to open `https://jamestannahill.com/`, scroll to "Ventures & Platforms", and screenshot. Confirm the ProSecPR card renders with the "ProSecPR" text fallback (no broken image, not showing "Art."), the correct description, and a working "Visit →" link to prosecpr.com.

---

## Phase 2 — Standalone entity-graph repos (consistency sync)

> These repos predate the live site's xAI/"Managing Partner" updates. The required deliverable for each task is **adding ProSecPR consistently**. Where a file is being rewritten anyway (the llms files), also bring its James-level facts into line with the live site (xAI role, "President & Managing Partner") so the graph stops contradicting itself. Deeper structural reconciliation beyond the touched fields is out of scope (see spec).

### Task 7: `~/jamestannahill-llms`

**Files:**
- Modify: `~/jamestannahill-llms/llms.txt`
- Modify: `~/jamestannahill-llms/llms-full.txt`

- [ ] **Step 1: Sync `llms.txt`**

Bring its lead summary, "Ventures & Platforms", and (if present) roles section into line with `~/jamestannahill-com/public/llms.txt` — add the same ProSecPR lead sentence, Current-Roles bullet, and Ventures bullet from Task 4, and update the lead paragraph to include the xAI role / "President & Managing Partner" wording to match the live file. No em-dashes.

- [ ] **Step 2: Sync `llms-full.txt`**

Add the ProSecPR VENTURES line and citable FAQ Q&A from Task 5.

- [ ] **Step 3: Verify**

Run: `cd ~/jamestannahill-llms && grep -c "ProSecPR" llms.txt llms-full.txt && grep -c "—" llms.txt llms-full.txt`
Expected: ProSecPR counts >= 1 each; em-dash counts `0`.

- [ ] **Step 4: Commit (and push if it has a remote)**

```bash
cd ~/jamestannahill-llms
git add llms.txt llms-full.txt
git commit -m "Add ProSecPR; align James facts with live site (xAI, Managing Partner)"
git push 2>/dev/null || echo "no remote / local-only — skip push"
```

---

### Task 8: `~/jamestannahill-schema/schema.json`

**Files:**
- Modify: `~/jamestannahill-schema/schema.json`

**Interfaces:**
- Consumes: existing `#person` node with `affiliation` (@id list) and `worksFor` (@id refs).
- Produces: `#prosecpr` Organization node + Person `affiliation`/`sameAs` wiring (mirrors Task 3, adapted to this file's @id-ref style).

- [ ] **Step 1: Add `#prosecpr` to the `@graph`**

Append this object as the last element of the `@graph` array (add a comma after the current last node):

```json
{
  "@type": "Organization",
  "@id": "https://www.jamestannahill.com/#prosecpr",
  "name": "ProSecPR",
  "alternateName": "PROSECPR",
  "url": "https://prosecpr.com",
  "slogan": "American Strength · Regional Intelligence.",
  "description": "ProSecPR is a veteran-led security advisory firm uniting the operational discipline of America's defense and national-security community with the cultural intelligence required to operate across Latin America. It protects people, organizations, infrastructure, and strategic interests by integrating four capabilities into one system: strategic intelligence, elite personnel, advanced technology, and continuous protection. Headquartered in Puerto Rico, forward-based in Miami, with a strategic network in Washington, D.C. and on-the-ground intelligence in Venezuela. Security advisory, not security contracting.",
  "areaServed": ["Puerto Rico", "United States", "Latin America", "Venezuela"],
  "knowsAbout": ["Security Risk Advisory", "Threat & Vulnerability Assessment", "Protective Operations", "Strategic Intelligence", "Human & Information-Environment Analysis", "Crisis Management", "Latin America / Venezuela Country Intelligence"],
  "member": { "@id": "https://www.jamestannahill.com/#person" }
}
```

- [ ] **Step 2: Wire the Person node**

In the `#person` node, add `{ "@id": "https://www.jamestannahill.com/#prosecpr" }` to the `affiliation` array, and add `"https://prosecpr.com"` to the `sameAs` array.

- [ ] **Step 3: Verify the JSON parses and contains the node**

Run:
```bash
cd ~/jamestannahill-schema && node -e "const g=require('./schema.json'); const ids=g['@graph'].map(n=>n['@id']); if(!ids.includes('https://www.jamestannahill.com/#prosecpr')) throw new Error('missing #prosecpr'); console.log('OK: valid JSON, #prosecpr present')"
```
Expected: `OK: valid JSON, #prosecpr present`.

- [ ] **Step 4: Commit (and push if it has a remote)**

```bash
cd ~/jamestannahill-schema
git add schema.json
git commit -m "Add ProSecPR Organization node + wire Person affiliation/sameAs"
git push 2>/dev/null || echo "no remote / local-only — skip push"
```

---

### Task 9: `~/jamestannahill-map`

**Files:**
- Modify: `~/jamestannahill-map/llms.txt`, `~/jamestannahill-map/llms-full.txt`
- Inspect, and modify if it enumerates ventures: `~/jamestannahill-map/index.html`, `~/jamestannahill-map/contact.html`

- [ ] **Step 1: Sync the map's llms files**

Add the ProSecPR lead sentence + Ventures bullet (Task 4 wording) to `~/jamestannahill-map/llms.txt`, and the VENTURES line + FAQ (Task 5 wording) to `llms-full.txt`. No em-dashes.

- [ ] **Step 2: Check the HTML for a ventures list**

Run: `cd ~/jamestannahill-map && grep -lniE "plocamium|ventures|1ness" index.html contact.html`
If a ventures list exists in the HTML, add a ProSecPR entry matching the existing markup pattern (name, short description, link to https://prosecpr.com). If neither file enumerates ventures, skip the HTML edit.

- [ ] **Step 3: Verify**

Run: `cd ~/jamestannahill-map && grep -c "ProSecPR" llms.txt llms-full.txt && grep -c "—" llms.txt`
Expected: ProSecPR >= 1 in each llms file; em-dashes `0`.

- [ ] **Step 4: Commit + deploy (CF Pages microsite)**

```bash
cd ~/jamestannahill-map
git add -A
git commit -m "Add ProSecPR to roster (llms + any ventures list)"
git push 2>/dev/null || echo "no remote — skip push"
```
If this microsite deploys via its own command (check for `wrangler.toml` / a deploy script), run that; otherwise a git push to its CF-Pages-connected repo auto-deploys.

---

### Task 10: `~/jamestannahill-mirror` refresh + final consistency check

**Files:**
- Modify: `~/jamestannahill-mirror/jamestannahill.com/**` (regenerated mirror content)

- [ ] **Step 1: Refresh the mirror**

Re-mirror the live site (or copy the freshly built `~/jamestannahill-com/dist/client` assets the mirror tracks) so `~/jamestannahill-mirror/jamestannahill.com` reflects the ProSecPR content. Use whatever mechanism produced the existing mirror (inspect for a fetch/copy script).

- [ ] **Step 2: Verify the mirror carries ProSecPR**

Run: `grep -rc "ProSecPR" ~/jamestannahill-mirror/jamestannahill.com | grep -v ':0' | head`
Expected: at least one mirrored file contains ProSecPR.

- [ ] **Step 3: Cross-asset consistency sweep**

Run:
```bash
for f in ~/jamestannahill-com/public/llms.txt ~/jamestannahill-llms/llms.txt ~/jamestannahill-map/llms.txt; do
  echo "== $f =="; grep -o "Head of Field Operations" "$f" | head -1; grep -o "prosecpr.com" "$f" | head -1
done
grep -rci "techno-statecraft\|leapfrog\|vault Venezuela\|frontier innovation base" \
  ~/jamestannahill-com/public/llms*.txt ~/jamestannahill-com/src/components/*.astro
```
Expected: each llms file shows `Head of Field Operations` and `prosecpr.com`; the dropped-framing grep returns `0` everywhere.

- [ ] **Step 4: Commit (and push if it has a remote)**

```bash
cd ~/jamestannahill-mirror
git add -A
git commit -m "Mirror: refresh with ProSecPR roster addition"
git push 2>/dev/null || echo "no remote / local-only — skip push"
```

---

## Self-Review

**Spec coverage:**
- VenturesSection card → Task 1. BioSection prose → Task 2. SEOHead JSON-LD (Person + `#prosecpr`) → Task 3. `public/llms.txt` → Task 4. `public/llms-full.txt` → Task 5. Deploy + verify → Task 6. Standalone `-llms` → Task 7, `-schema` → Task 8, `-map` → Task 9, `-mirror` → Task 10. Bundled xAI/title drift fix → folded into Task 7 (and noted as scoped-out for the structural `-schema` case). All spec sections covered.
- Open items (logo: text-only fallback handled in Task 1; ventures order: ProSecPR placed 2nd, flagged adjustable) — addressed.

**Placeholder scan:** No TBD/TODO. Every edit shows exact strings/code. The only deliberately conditional step is Task 9 Step 2 (HTML ventures list "if present"), which is gated by an explicit grep and has both branches defined.

**Type/string consistency:** Role string `Head of Field Operations` identical across Tasks 2/3/4/5/7/9. URL `https://prosecpr.com` consistent. `@id` `#prosecpr` consistent (note the live site uses bare `jamestannahill.com` host; the standalone `-schema` repo uses `www.jamestannahill.com` to match its existing `#person` host — intentional, verified against each file's existing `@id` style). `logoText` field name consistent between interface, Art entry, and ProSecPR entry in Task 1. Master description identical (verbatim) in Tasks 3, 5, 8.
