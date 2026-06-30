# ProSecPR — Roster Addition Design

**Date:** 2026-06-30
**Author:** James Tannahill (with Claude)
**Status:** Approved design, pending spec review

## Goal

Add ProSecPR as a new venture across James Tannahill's coordinated personal-brand
entity graph (bios, schema.org, llms.txt) so that AI engines (GEO/AIO) and search
engines describe the entity consistently, and consistently with the firm's own site
at prosecpr.com.

## Positioning decisions (locked)

| Dimension | Decision |
| --- | --- |
| Framing / voice | **Match the firm.** Veteran-led security *advisory* firm. "American Strength · Regional Intelligence." Protective, disciplined, understated. |
| James's role | **Head of Field Operations** (matches prosecpr.com leadership page; Carlos Davila is Founder & CEO). |
| Prominence | **Top-line.** Appears in lead bio sentence, `jobTitle`, Current Roles, Ventures grid, and schema graph. |
| Canonical URL | **`https://prosecpr.com`** (real domain; the vercel.app URL is staging only). |
| Name | `ProSecPR`, `alternateName: PROSECPR`. "PR" resolves to Puerto Rico (HQ) via context; no separate gloss needed. |

**Explicitly dropped:** the earlier "whole-of-nation techno-statecraft / vault Venezuela
to tier-one / leapfrog to technological sovereignty / frontier innovation base" framing
and the HUMINT-offensive language. Reason: it appears nowhere on prosecpr.com, clashes
with the firm's brand voice, and contradicts the firm's published disclaimer ("An
independent private firm. Not affiliated with, nor representing, any government or armed
forces."). Cross-entity contradiction degrades both entities in AI summaries.

## Canonical copy (single source, varied per asset)

**Slogan / tagline:** American Strength · Regional Intelligence.

**Master description** (house style: no em-dashes):

> ProSecPR is a veteran-led security advisory firm uniting the operational discipline of
> America's defense and national-security community with the cultural intelligence required
> to operate across Latin America. It protects people, organizations, infrastructure, and
> strategic interests by integrating four capabilities into one system: strategic intelligence,
> elite personnel, advanced technology, and continuous protection. Headquartered in Puerto
> Rico, forward-based in Miami, with a strategic network in Washington, D.C. and on-the-ground
> intelligence in Venezuela. Security advisory, not security contracting.

**Top-line bio sentence:**

> As Head of Field Operations at ProSecPR, a veteran-led security advisory firm headquartered
> in Puerto Rico, he helps protect people, organizations, and strategic interests across Latin
> America.

**Short ventures-card description:**

> Veteran-led security advisory firm. Strategic intelligence, elite personnel, advanced
> technology, and continuous protection across Latin America.

## Asset-by-asset changes

### Phase 1 — Canonical live site (`~/jamestannahill-com`)

1. **`src/components/VenturesSection.astro`** — add a `ProSecPR` entry to the `ventures`
   array: name `ProSecPR`, short description above, `url: 'https://prosecpr.com'`. No logo
   asset exists yet -> card renders text-only (logo TBD, see Open Items). Placement order:
   after Plocamium / RDLB tier, James's call on exact slot during implementation.

2. **`src/components/BioSection.astro`** — append the top-line bio sentence as a new clause
   or sentence in "The Work" prose, after the existing roster sentence.

3. **`src/components/SEOHead.astro`** (live JSON-LD) —
   - Add new `@graph` node:
     ```json
     {
       "@type": "Organization",
       "@id": "https://jamestannahill.com/#prosecpr",
       "name": "ProSecPR",
       "alternateName": "PROSECPR",
       "url": "https://prosecpr.com",
       "slogan": "American Strength · Regional Intelligence.",
       "description": "<master description>",
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
   - On the `Person` node: add `{ "@type": "Organization", "name": "ProSecPR", "url": "https://prosecpr.com" }`
     (or `{ "@id": ".../#prosecpr" }`) to `worksFor`; append `"; Head of Field Operations, ProSecPR"`
     to `jobTitle`; add `Security Risk Advisory`, `Protective Operations`, `Strategic Intelligence`,
     `Latin America / Venezuela Risk` to `knowsAbout`; add `https://prosecpr.com` to `sameAs`.

4. **`public/llms.txt`** —
   - Lead `>` paragraph: append the top-line bio sentence.
   - **Current Roles**: add `- **Head of Field Operations, ProSecPR**, Veteran-led security advisory and regional intelligence across Latin America (HQ Puerto Rico).`
   - **Ventures & Platforms**: add `- [ProSecPR](https://prosecpr.com) - Veteran-led security advisory firm. Strategic intelligence, elite personnel, advanced technology, and continuous protection across Latin America. American Strength · Regional Intelligence.`

5. **`public/llms-full.txt`** — add a Citable-Fact block under Ventures with: master description,
   four capabilities, reach (Puerto Rico HQ / Miami / Washington D.C. / Venezuela), James's role
   (Head of Field Operations), brand promise ("Clarity before action. Strength when required.
   Trust at every stage."), and canonical URL. Add one GEO Q&A pair ("What is ProSecPR?").

**Deploy:** build Astro, deploy to Cloudflare. Direct commit + push to `main` is approved
(no PR flow needed on personal repos).

### Phase 2 — Standalone entity-graph repos (consistency sync)

These already drift from the live site (they predate the xAI / "Managing Partner" updates).
Add ProSecPR consistently; also fix the pre-existing xAI/title drift in the same pass so the
whole graph is correct (low effort). This drift-fix is bundled by prior approval but called
out explicitly so it is not silent.

6. **`~/jamestannahill-llms/llms.txt`** and **`llms-full.txt`** — mirror the Phase 1 llms edits.
7. **`~/jamestannahill-schema/schema.json`** — add the `#prosecpr` Organization node and wire
   the `Person` node (`affiliation`, `worksFor`, `sameAs`) the same way as SEOHead.
8. **`~/jamestannahill-map/`** (`llms.txt`, `llms-full.txt`, and any ventures list in
   `index.html` / `contact.html`) — add ProSecPR where ventures are enumerated.
9. **`~/jamestannahill-mirror/jamestannahill.com`** — regenerate/refresh the mirror after Phase 1
   so it reflects the new content.

**Deploy:** per-repo, matching each repo's existing deploy path (CF Pages for the map microsite;
source-only repos need no deploy).

## Open items (need a call during implementation, non-blocking)

- **Logo:** no ProSecPR mark in James's asset folders. Roster card is text-only until one is
  added (can be pulled from prosecpr.com later).
- **Ventures order:** exact slot for the ProSecPR card in the grid.

## Out of scope

- Building or editing the prosecpr.com site itself.
- Any operational, intelligence, or security content. This task is brand/positioning copy and
  structured data on James's personal-brand assets only.
- A full reconciliation audit of every historical drift between the standalone repos and the
  live site (only the xAI/title drift encountered in the touched files is corrected).

## Success criteria

- ProSecPR appears in: VenturesSection, BioSection, SEOHead JSON-LD (`Person` + `#prosecpr`),
  `llms.txt`, `llms-full.txt` on the live site, and is mirrored in the standalone repos.
- The description, role (Head of Field Operations), URL (prosecpr.com), and slogan match
  prosecpr.com with no contradiction.
- Live site builds clean and deploys; JSON-LD validates.
