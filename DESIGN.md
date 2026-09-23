---
version: alpha
name: jamestannahill.com
description: Personal site for James Tannahill. Swiss-leaning editorial system set in NHG Display, ink and white grounds, one amber accent.
colors:
  ink: "#0a0a0a"
  muted: "#6b7280"
  border: "#0a0a0a1a"
  amber: "#c9882a"
  amber-dark: "#b5771f"
  amber-text: "#8f5d17"
  t-bg: "#ffffff"
  t-ink: "#1a1a1a"
  t-body: "#444444"
  t-deck: "#666666"
  t-muted: "#707070"
  t-faint: "#767676"
  t-amber: "#8f5d17"
  t-rule: "#eeeeee"
  t-rule-strong: "#1a1a1a"
  t-plate: "#f5f5f5"
typography:
  sans:
    fontFamily: NHG Display
  section-heading:
    fontFamily: NHG Display
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: -0.02em
  essay-body:
    fontFamily: NHG Display
    fontSize: 17px
    lineHeight: 1.7
  essay-label:
    fontFamily: NHG Display
    fontSize: 11px
    letterSpacing: 0.25em
  eyebrow:
    fontFamily: NHG Display
    fontSize: 12px
  caption:
    fontFamily: NHG Display
    fontSize: 12px
    lineHeight: 1.6
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
  nav-cta:
    textColor: "{colors.amber}"
  nav-cta-hover:
    textColor: "{colors.amber-dark}"
  link-on-light:
    textColor: "{colors.amber-text}"
  essay-eyebrow:
    textColor: "{colors.t-amber}"
    typography: "{typography.eyebrow}"
  essay-section-label:
    textColor: "{colors.t-amber}"
    typography: "{typography.essay-label}"
---

## Overview

jamestannahill.com is the personal site of an operator, investor and builder: a single long home page, a contact page, venture pages, and an essay section at /thoughts. The direction is Swiss and editorial. One typeface (NHG Display in three weights) carries everything, grounds alternate between ink and white, structure comes from hairline rules and spacing rather than boxes, and a single amber accent marks action and emphasis. Photography and video supply the atmosphere; the interface itself stays quiet.

## Colors

- Ink and white are the two grounds. Full-bleed media sections (hero, contact hero, RDLB reel, casual section) and all site chrome (header, mobile menu, footer) sit on ink; reading and content sections sit on white.
- Amber is the only accent and it means action or emphasis: primary buttons, the Contact nav item, the active-nav underline, the bio headshot bar, the essay reading-progress bar, and hover states on cards.
- Amber has two text forms. On ink, use `amber` directly. On white or any light ground, text and focus rings use `amber-text`, because `amber` fails text contrast on white. `amber` stays legal on light grounds only as a fill or non-text mark (button fill, progress bar, hover rule).
- A primary button is always an amber fill with an `ink` label, never a white label.
- Rules use `border`, a low-alpha ink, so hairlines sit in the page rather than on it. Grids of cards are drawn with shared one-pixel rules (gap-px over a `border` ground, or matched border sides), not separate outlined boxes.
- Within /thoughts, never reference site colors or hex literals directly. Use the `t-*` tokens so the whole section flips with the color scheme; `t-amber` is the /thoughts accent and already resolves to the correct contrast form per scheme.

## Themes

The main site is light-only with ink chrome. /thoughts (index and every essay, scoped by `.thoughts-page`) follows `prefers-color-scheme`; light is the default. Header and footer stay ink in both schemes. Photos inside /thoughts carry a hairline inset edge whose color also flips.

| Token | Light (default) | Dark |
|---|---|---|
| t-bg | #ffffff | #121212 |
| t-ink | #1a1a1a | #f2f0ea |
| t-body | #444444 | #c9c6bd |
| t-deck | #666666 | #a8a59c |
| t-muted | #707070 | #8f8c84 |
| t-faint | #767676 | #8a8780 |
| t-amber | #8f5d17 | #c9882a |
| t-rule | #eeeeee | #262626 |
| t-rule-strong | #1a1a1a | #e6e2d8 |
| t-plate | #f5f5f5 | #1c1c1c |

## Typography

- NHG Display is the only family, self-hosted in Roman, Medium and Bold. Helvetica Neue, Helvetica, Arial is the fallback stack. Do not introduce a second family on shared surfaces.
- The root font size is set as a percentage of the user's default, not a fixed pixel value, so browser text-size preferences scale the whole site. All rem-based sizes inherit that scale.
- Form controls are pinned to 16px on phones so iOS Safari does not zoom on focus.
- Section headings use the shared `.sec-h` role (`section-heading`): sentence case, Medium weight, tight negative tracking, balanced wrapping, and a fluid size that scales with the viewport.
- Display headlines (hero, contact hero, 404, venture titles) are Bold or Medium with tight negative tracking and a line height near one.
- Body copy on white runs at a generous line height in a mid-gray, not ink; essays use `essay-body` on a measure near seventy characters.
- Uppercase with wide tracking is reserved for small functional text: navigation, button labels, form labels, stat labels, Competencies practice lists, essay section labels (`essay-label`) and "Read the essay" style calls to action.
- Paragraphs, captions, definitions and list items use pretty wrapping to avoid orphans; headings balance.
- Numerals in stat blocks and counts use tabular figures.

## Layout

- Content sits in a single centered column family: a wide container for home sections, header and footer, a narrower column for /thoughts index and venture pages, and an essay column sized for the reading measure. Horizontal padding widens from mobile to desktop.
- Home sections are separated by a top hairline in `border` and vertical padding; do not add background tints to separate white sections.
- Full-bleed hero sections anchor copy to the bottom-left over a dark gradient that deepens toward the text.
- Header, footer and fixed overlays respect iOS safe-area insets.
- Every tappable element, including footer links and icon links, has at least a 44px hit area; primary buttons and the mobile menu toggle use 48px.
- In-page anchors that land under the fixed header carry a scroll margin so the target lands on screen.

## Elevation & Depth

- The system is flat. Depth appears only on interaction: venture cards lift slightly and reveal a soft shadow on hover, and that shadow lives on a pseudo-element so only opacity animates.
- The header is translucent ink with a backdrop blur. The mobile menu overlay is solid ink so the page cannot show through.
- The consent banner is the one floating panel: near-black, thin light border, shadow.

## Shapes

- Corners are square. Buttons, inputs, cards, venture tiles and photos have no radius. Exceptions are the consent banner panel, the round author headshot in essay footers, and an app icon on venture pages.
- Form inputs are underline-only: no box, a single bottom rule that turns amber on focus.
- Photos get a one-pixel inset hairline edge (`.photo-edge`) so they do not bleed into the ground.

## Components

- Header: fixed, translucent ink, uppercase tracked wordmark at left, tracked uppercase nav at right in white at reduced opacity. Contact is the one amber item. The current page gets a one-pixel amber underline and `aria-current`. On mobile the nav becomes a full-screen ink overlay that traps focus by making the page inert and returns focus to the toggle on close; the hamburger folds into an X.
- Primary button: amber fill, ink label, uppercase tracked, square, scales down slightly on press.
- Secondary button: transparent with a thin rule and muted or light label, same size and shape as primary.
- Venture card: white tile in a ruled grid; a transparent top rule turns amber on hover. Links inside use `amber-text`.
- Competencies index: rows on a cool marine ramp that switch between a cool state and a deep state as each row nears the reading line, with an accent spine that grows continuously. Row ground and ink flip together as one step so no row passes through an intermediate tint where neither ink is legible. Under reduced motion the ramp is static, top to bottom.
- FAQ accordion: native details and summary on ink, hairline separators, amber plus sign that rotates to a cross when open, and a height-and-opacity open transition where supported.
- Contact form: on ink, uppercase tracked labels in light gray, underline inputs, amber submit with an inline spinner while sending; success and error messages are persistent live regions.
- Essay chrome: every essay opens with `EssayHeader` (amber Thoughts eyebrow, title, deck, date and reading time, reading-progress bar) and closes with `EssayFooter` (share row, author line, newer and older navigation). In long essays the header hides on scroll down and returns on scroll up.
- Essay cards on /thoughts: the newest essay is a full-width lead with art first; the rest are rows with art at left. Hover or focus scales the art slightly, turns the title `t-amber`, and draws an underline under the call to action.
- Skip link: first focusable element on every page, hidden until focused, then shown as a white-on-black chip at the top left that jumps to `main`.

## Do's and Don'ts

- Do give every focusable element a visible ring: `amber-text` on light grounds, `amber` inside header, footer, the mobile menu and ink sections. Components that draw their own ring override locally.
- Do make every pressable thing answer the press with a small scale-down.
- Do use the shared easing tokens (`--ease-out` for UI entrances and presses, `--ease-drawer` for the hiding header) rather than built-in curves.
- Do treat reduced motion as fewer and gentler, not zero: remove movement (transforms, blur, parallax, scrubbing), keep short opacity fades so things do not pop into existence.
- Do keep scroll reveals progressive: CSS scroll-driven animation where supported, an IntersectionObserver fallback otherwise, and fully visible content with no JavaScript.
- Don't build section rhythm out of tracked-out caps labels; section headings are sentence case in the display face and spacing carries the rhythm.
- Don't let a continuously mixed tint sit behind text when neither ink clears contrast on it; flip ground and ink together instead.
- Don't restyle Apple's App Store badge; show it as supplied.

## Open Questions

- Marine as a second accent. The Competencies ramp introduces a teal family, and venture pages reuse its accent for inline links, the namesake rule, the build section heading and the Visit button. Decide whether marine is a sanctioned secondary accent (then promote it to named tokens in global.css) or whether those surfaces should return to amber.
- Tracked caps labels. The global comment says rhythm comes from spacing, not tracked-out caps labels, yet tracked uppercase remains on nav, buttons, form labels, stat labels, practice lists, essay section labels and 404 eyebrow. Confirm the rule is scoped to section headings only, or retire tracked caps from the non-functional cases.
- Monospace voice on venture pages. Venture pages add a system monospace stack for breadcrumbs, the record line and the spec table, a second family that appears nowhere else. Decide whether it is a sanctioned role or page-local.
- Unused tokens. `--color-accent`, `--color-surface` and `--color-amber-subtle` are declared but not referenced; `--color-accent` is near-black despite its name. Retire or assign them.
- Inline literals. Several shared surfaces still use literals in place of tokens (footer gray, bio and venture body gray, casual section ground, consent panel ground, error red). Decide which deserve named tokens.
- Dark mode scope. Only /thoughts follows the color scheme. Decide whether the rest of the site stays light-only by intent.

## Motion and feedback (apple-design pass, 2026-09-23)

- The mobile menu's closed state keys off `data-open` plus `inert`, never the `hidden` attribute: Tailwind's layered `[hidden]{display:none !important}` cannot be overridden and kills the fade.
- Reading-path type is in rem so browser text-size settings apply. Tap targets are at least 44px. The header turns solid under `prefers-reduced-transparency` and `prefers-contrast: more`.
