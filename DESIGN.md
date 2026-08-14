---
name: Chipfire
description: A blast-monitoring station for a chain-reaction strategy game — chart paper, ink traces, precise instrumentation.
colors:
  chart-stock: "#EDEAE3"
  chart-stock-deep: "#E3DFD5"
  lattice-line: "#D6D1C4"
  trace-ink: "#1F2421"
  trace-ink-soft: "#4A504B"
  trace-ink-faint: "#5E635E"
  signal-rust: "#C0501E"
  signal-orange: "#C4561E"
  signal-orange-ink: "#A34719"
  station-blue: "#2C5F87"
  ochre: "#B08721"
  ochre-ink: "#7B5F17"
  slate-green: "#3E6B5A"
typography:
  display:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.875rem)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.14em"
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  none: "0px"
  dot: "9999px"
spacing:
  2xs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.trace-ink}"
    textColor: "{colors.chart-stock}"
    rounded: "{rounded.none}"
    padding: "8px 24px"
  button-primary-hover:
    backgroundColor: "{colors.trace-ink}"
    textColor: "{colors.chart-stock}"
  button-secondary:
    backgroundColor: "{colors.chart-stock}"
    textColor: "{colors.trace-ink}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.chart-stock-deep}"
    textColor: "{colors.trace-ink}"
  panel-cluster:
    backgroundColor: "{colors.chart-stock-deep}"
    textColor: "{colors.trace-ink}"
    rounded: "{rounded.none}"
    padding: "12px"
  input-field:
    backgroundColor: "{colors.chart-stock}"
    textColor: "{colors.trace-ink}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
---

# Design System: Chipfire

## Overview

**Creative North Star: "The Blast-Monitoring Station"**

Chipfire's subject is a controlled detonation propagating through a lattice — accumulation, threshold, release. The visual world is not a game skin; it is the instrument that would actually sit in the room watching that happen: a seismograph and a blast-monitoring chart. A fine grid, ink traces, a station clock. Everything is precise and legible rather than arcade — no glow-for-its-own-sake, no celebratory chrome, no decoration that isn't also a reading. When the system needs to say something ("this cell is one orb from firing," "here is where the last cascade went"), it says it the way an instrument does: a mark, a number, a trace left on the paper — never a badge or a burst of color.

The system runs in exactly two states, never a blend. By day it is chart paper: cream stock, a hairline-printed grid, dark ink. By night it is the station's own display, which is emissive rather than reflective — the palette folds in on itself (today's ink becomes the raised surface, today's paper becomes the ink) rather than being replaced by an invented "dark theme." A detonation on an instrument is light at night, not ink; the system was built to make that true by construction, not by a media-query override on every color.

Key Characteristics:
- Flat, printed-paper materiality — a hairline lattice exists before any game state does, and cells sit *in* it rather than being drawn as it.
- Zero border-radius on every container, button, card, and input. Roundness is reserved for two things only: a data point (a dot, a bar's flowing edge) — never a box.
- One saturated hue per player, and saturated color appears nowhere else. Everything structural is ink, tinted paper, or a hairline.
- Motion is a reading, not decoration: cascades propagate in event order, a cell one orb from firing trembles because it is genuinely about to, and a settled position's afterglow does not animate at all — it is a still fact about how the position was reached.
- Type is instrument lettering: Space Grotesk carries display type and every numeral (tabular figures, so counters don't jitter), IBM Plex Sans carries prose, IBM Plex Mono carries anything meant to be read character-by-character and copied accurately (codes, hashes).

## Colors

Chart paper with ink on it, plus exactly four saturated hues that never appear anywhere except as player identity.

### Primary
- **Signal Rust** (#C0501E): the brand mark's core only — the "Propagation" glyph's center dot. Deliberately never used as a player color, even though it sits one step from Signal Orange in hue; the mark has to stay legible as *the brand* independent of who is playing.

### Secondary — Player Identity (the system's only saturated colors)
- **Signal Orange** (#C4561E): Player 1. Disc-shaped orbs. Large shapes and orb fills only — at 2.76:1 on chart stock it is not accessible as text; use Signal Orange Ink for anything that carries a word.
- **Signal Orange Ink** (#A34719): the same hue, darkened to clear 4.5:1 on chart stock. Player 1's name, in text.
- **Station Blue** (#2C5F87): Player 2. Ring-shaped orbs. Clears text contrast unaided — no separate ink variant needed.
- **Ochre** (#B08721): Player 3. Diamond-shaped orbs. 2.76:1 on chart stock — orbs and large marks only.
- **Ochre Ink** (#7B5F17): darkened Ochre for anywhere the color carries a word.
- **Slate Green** (#3E6B5A): Player 4. Triangle-shaped orbs. Clears text contrast unaided.

### Neutral
- **Chart Stock** (#EDEAE3): the ground. Page background, the paper everything else sits on.
- **Chart Stock Deep** (#E3DFD5): a raised or grouped surface — hover states, the readout strip under the board, clustered HUD panels. Never a second background color; always this exact relationship to Chart Stock.
- **Lattice Line** (#D6D1C4): the printed background grid on the page itself (`background-image`, 24px cells) — the paper's own texture, present before any component renders.
- **Trace Ink** (#1F2421): primary text and structural borders. 13.1:1 on Chart Stock.
- **Trace Ink Soft** (#4A504B): secondary text, hints, captions. 6.9:1.
- **Trace Ink Faint** (#5E635E): tertiary text, meta lines, disabled-adjacent copy. 5.1:1 — still comfortably above AA; the palette never drops a text color below the floor to fake a fourth weight.

### Night ground (the same system, inverted by construction)
Under `prefers-color-scheme: dark`, only the color tokens are redefined; every border, alpha, and component inherits the change automatically because nothing outside the token layer holds a literal color. Night ground `#171A18`, raised surface `#1F2421` (today's Trace Ink, now a surface), ink `#E8E4DC` (today's Chart Stock, now the ink, 13.83:1), and all four player hues lift in lightness until each clears text contrast unaided on the night ground (Orange → `#E2703A`, Blue → `#6FA8D6`, Ochre → `#D9AE49`, Green → `#6FAE92`). Signal Rust does not move; the brand mark's core is invariant across both grounds by rule, not by accident. Contrast floor on both grounds: 4.83:1.

### Named Rules
**The One-Hue-Per-Player Rule.** Saturated color exists in this system for exactly one purpose — telling players apart. It never decorates a button, a chart axis, an icon, or a piece of chrome. If a color other than ink, tinted paper, or an active player's hue appears on screen, something has drifted.

**The Shape-Before-Color Rule.** Every player color is paired with a distinct orb silhouette (disc / ring / diamond / triangle) and every UI element that names a player repeats both. Color-vision deficiency must never cost a player the ability to read the board.

## Typography

**Display Font:** Space Grotesk (weight range 300–700), self-hosted woff2, no CDN.
**Body Font:** IBM Plex Sans (weights 400/500), self-hosted.
**Label/Mono Font:** IBM Plex Mono (weight 400), self-hosted, not preloaded — it only appears in codes and hashes, never in a first paint.

**Character:** Mechanical and exact rather than warm — Space Grotesk's distinctive figures are the point, because this is a system where numerals (orb counts, critical mass, cascade length, move number) carry real information and have to be told apart from body prose at a glance. IBM Plex Sans is chosen for being unremarkable: legible instrument-panel prose that never competes with the numbers next to it.

### Hierarchy
- **Display** (500, `clamp(1.75rem, 3.5vw, 2.875rem)` / 46px max, 1.15 line-height, −0.01em tracking): the wordmark's name, panel titles one step above their labels (`.heading-panel`), win/loss statements.
- **Headline / Body-large** (400, 18–22px, 1.35–1.6): hero lede copy, the one line of text a landing page leads with.
- **Body** (400, 16px, 1.6, 65ch-narrower measure than typical "prose" defaults — this copy is short by policy): paragraphs, rule explanations, captions.
- **Numeral** (`.font-numeral`, Space Grotesk + `font-variant-numeric: tabular-nums`): every counter, hash-adjacent number, and score. Never system-ui; a counter that reflows its own width as it ticks is a small, constant tell that the interface isn't precise.
- **Label** (500, 11px, uppercase, 0.14em tracking, `.label-micro`): instrument-panel lettering — field labels, panel micro-headers. Rationed: no more than one such label per logical group, or a rail of them reads as a list of shouted fragments rather than a hierarchy.
- **Mono** (400, 13px): connection codes, state hashes, cell notation — anything meant to be read character-by-character and pasted accurately.

### Named Rules
**The One Weight Above Rule.** A panel's title (`.heading-panel`, sentence case, display face) sits exactly one visual step above the `.label-micro` fields inside it. Every heading in a stack being the same 11px uppercase label was tried and read as one undifferentiated shout; the fix was a second, quieter step, not louder tracking.

## Layout

Two container widths, chosen by what the page is for: `max-w-5xl` for reading surfaces (the landing page), `max-w-6xl` for the game screen, where a wide two-column board-plus-rail layout needs the room. Section rhythm on reading pages uses the `xl` (40px) and `2xl` (64px) spacing steps; the game screen is denser, using `sm`/`md` (12–16px) between HUD elements since it is read continuously during play rather than scanned once.

The board itself is not laid out by the page grid at all — it is sized to fit the viewport (`(100dvh − chrome) × aspect-ratio`) so a tall board never forces a scroll to see the move about to be made, with every other element's height accounted for in a documented constant.

Spacing is a named scale, not arbitrary Tailwind numerics: `2xs` 4px, `xs` 8px, `sm` 12px, `md` 16px, `lg` 24px, `xl` 40px, `2xl` 64px, referenced by role (`gap-lg` states a rhythm) rather than by raw measurement.

Responsive collapse: the board-plus-rail two-column layout (`lg:grid-cols-[1fr_18rem]`) stacks to a single column below `lg`, with the turn indicator explicitly reordered above the board on narrow viewports rather than left to source order. Multi-panel figures (the landing page's before/during/after cascade diagram) stack vertically below `sm` rather than compressing three panels into a width too narrow to read.

## Elevation & Depth

Flat by default, with depth read from paper tone rather than shadow. Chart Stock Deep is the only "raised" surface in the system, and it is a tint, not a shadow — a grouped or active panel gets a slightly deeper paper tone and a hairline border, never a drop shadow. Structural elevation is expressed with an inset box-shadow exactly once, as a rule-edge (the active player's card gets `shadow-[inset_2px_0_0_0]` in the player's ink — a line, not a lift). A soft outer `shadow-lg` appears exactly once in the whole system, on the single native `<dialog>` overlay (How to Play), because that is the one element genuinely floating above the page rather than sitting in the paper's own layers.

### Shadow Vocabulary
- **Rule-edge** (`box-shadow: inset 2px 0 0 0; color: currentColor (trace or player ink)`): marks the active/selected state of a card in a list (the current player's turn) without relying on hue alone.
- **Overlay lift** (`box-shadow: theme(shadow-lg)`): the one floating surface in the system — a native dialog. Not used on cards, panels, or dropdowns.

### Named Rules
**The One Overlay Rule.** Only a true modal (a native `<dialog>`) gets a lift shadow. Everything else that needs to read as "above" its neighbor does so with a deeper paper tone or a border, because this system has exactly one thing that is ever actually floating above the page.

## Shapes

Every container, button, card, and input has zero border-radius. The system reads as printed and cut, not molded — chart paper doesn't have rounded corners, and neither does anything drawn on it. Borders are hairline (0.5px–1px) and are the primary way structure is expressed; a component that would elsewhere get a card shadow gets a border instead.

Two deliberate, narrow exceptions, both on data rather than containers: capacity-tick dots (`rounded-full`, 3px) inside an empty board cell, and the leading edge of the avalanche-distribution bar (`rounded-r-[4px]`), which reads as a value flowing to a point rather than stopping at a wall. Neither exception ever appears on a button, panel, card, or input.

### Named Rules
**The Sharp-Edged Rule.** Radius is zero everywhere except an actual data point. A rounded corner on a container is always a mistake in this system, not a style choice waiting to be made.

## Components

Every interactive surface reads as an instrument control: flat fills, hairline borders, and a state change expressed as an ink-weight or tone shift rather than a shadow, glow, or scale transform.

### Buttons
- **Shape:** square corners always (`{rounded.none}`), no exception.
- **Primary:** filled — `background: {colors.trace-ink}`, `color: {colors.chart-stock}`, `border: 1px solid {colors.trace-ink}`, padding `8px 24px`. On a page of hairlines, the one solid filled block is unmistakably the way in; there is never more than one primary action visible at a time.
- **Secondary / Ghost:** outlined — `border: 1px solid` a lighter trace alpha (`trace-rule`, ~32% ink), transparent fill, `color: {colors.trace-ink}`.
- **Hover / Focus:** primary drops opacity to ~90% rather than changing hue; secondary fills with Chart Stock Deep. Focus-visible is one ring treatment app-wide: a 2px offset outline in Trace Ink, shown to keyboard users only, never to a mouse click.
- **Segmented control (a Chipfire signature):** a set of mutually-exclusive options (speed, difficulty, preview on/off) rendered as equal-width buttons inside one shared border, the active option filled in Trace Ink/Chart Stock and the rest transparent. Reads as one instrument with a selector, not four loose buttons — used for every either/or or one-of-N choice in the HUD.

### Panels / Clusters (a Chipfire signature)
- **Background:** `{colors.chart-stock-deep}` at reduced opacity (`chart-deep/30`), which is the system's only "grouped" surface treatment.
- **Border:** 1px hairline (`trace-hairline`, ~20% ink).
- **Internal Padding:** `sm` (12px).
- **Purpose:** groups several related HUD readouts (e.g. "This position": load gauge + cascade replay) under one visual unit so a long instrument rail reads as sections rather than an undifferentiated list of same-weight fragments. A cluster gets a `.heading-panel` title only when its contents don't already carry their own.

### Cards / Containers (player state)
- **Corner Style:** square.
- **Background:** Chart Stock normally; Chart Stock Deep when active/current.
- **Border:** hairline normally; full-weight Trace Ink border plus the rule-edge inset shadow when active.
- **Identity:** shape (via the player's orb glyph) always accompanies color; never color alone.

### Inputs / Fields
- **Style:** `border: 1px solid {colors.trace-rule}`, `background: {colors.chart-stock}`, numeral font for numeric fields, no radius.
- **Focus:** the app-wide focus ring (2px offset outline, Trace Ink).
- **Label position:** always above the field, in `.label-micro`, never a placeholder standing in for a label.

### The Board (signature component)
The defining custom component. A CSS Grid of square cells over a hairline lattice, `border-[0.5px] border-trace/25` between cells and `border-[0.5px] border-trace/40` around the whole board. Each cell can carry, layered: an "afterglow" reading (opacity-interpolated ink wash showing where the last cascade passed, never animated — a fact, not an effect), capacity-tick dots (empty cells only, showing critical mass at a glance), a claim wash in the capturing player's fill color, a burst ring (`scale + fade`, rippled outward from the triggering move by Manhattan distance), and registration-mark corner brackets on the most recently played cell. Every layer composites in a fixed order and every animation duration is fixed (never derived from the speed setting), so overlapping generations of a long cascade read as one propagating wave rather than a strobe.

### Orbs (signature component)
Player identity rendered as SVG shape (disc / ring / diamond / triangle) at fixed positions per count inside a cell — 1 through 5 have hand-placed layouts, 6+ falls back to a tabular numeral. Shape always carries the same information as color, independently.

## Do's and Don'ts

### Do:
- **Do** keep every container, button, card, and input at zero border-radius. Roundness is reserved for data points only (see The Sharp-Edged Rule).
- **Do** express "raised" or "grouped" with `chart-deep` tone and a hairline border, never a drop shadow (see The One Overlay Rule).
- **Do** pair every player-color usage with that player's orb shape; never rely on hue alone.
- **Do** use `.font-numeral` (Space Grotesk, tabular figures) for every counter, score, and hash-adjacent number.
- **Do** keep saturated color scoped to the four player hues and the brand mark's rust core; everything else is ink, tinted paper, or a hairline.
- **Do** honor `prefers-reduced-motion`: any animation above trivial must degrade to an instant, still, fully-informative state.

### Don't:
- **Don't** introduce a second "raised surface" tone. Chart Stock and Chart Stock Deep are the only two paper tones; a third invents a hierarchy nothing else in the system supports.
- **Don't** use Signal Rust (the mark's core) as a player color, even for a fifth-player extension. It has to keep reading as "the brand" independent of who is playing.
- **Don't** animate the afterglow, or add a decay/fade-over-time effect to it. It is a still reading of how the position was reached, and animating it would turn a fact into an effect.
- **Don't** add a shadow, glow, or gradient fill to a button, card, or panel. If something needs to look "important," give it the filled-primary treatment or move it into its own cluster — not a shadow.
- **Don't** derive a cascade animation's duration from the speed setting. Durations are fixed so overlapping generations read as one wave; only the *delay between* generations should change with speed.
