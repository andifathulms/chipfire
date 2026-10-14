---
name: Chipfire
description: A blast-monitoring station for a chain-reaction strategy game — chart paper, ink traces, precise instrumentation.
colors:
  vellum-ground: "#EEF2EF"
  vellum-raised: "#E2E9E5"
  vellum-surface: "#F9FBF9"
  vellum-bezel: "#DCE4E0"
  vellum-well: "#F5F8F6"
  lattice-line: "#D3DDD8"
  trace-ink: "#13201B"
  trace-ink-soft: "#3F4F48"
  trace-ink-faint: "#55655E"
  signal-rust: "#C0501E"
  vermilion: "#D55E00"
  vermilion-ink: "#A94800"
  blue: "#0067A8"
  reddish-purple: "#B4508C"
  reddish-purple-ink: "#9A3F76"
  bluish-green: "#00876A"
  bluish-green-ink: "#00705A"
typography:
  moment:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 8vw, 5.5rem)"
    fontWeight: 850
    fontStretch: "125%"
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    fontStretch: "105%"
    lineHeight: 1.35
  body:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 650
    fontStretch: "80%"
    lineHeight: 1
    letterSpacing: "0.06em"
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  cell: "6px"
  control: "8px"
  panel: "12px"
  housing: "16px"
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
    textColor: "{colors.vellum-ground}"
    rounded: "{rounded.control}"
    padding: "8px 20px"
  button-secondary:
    backgroundColor: "{colors.vellum-surface}"
    textColor: "{colors.trace-ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  segmented:
    backgroundColor: "{colors.vellum-raised}"
    rounded: "10px"
    padding: "3px"
  panel:
    backgroundColor: "{colors.vellum-surface}"
    textColor: "{colors.trace-ink}"
    rounded: "{rounded.panel}"
    padding: "16px"
  board-housing:
    backgroundColor: "{colors.vellum-bezel}"
    rounded: "{rounded.housing}"
    padding: "6px–8px"
  input-field:
    backgroundColor: "{colors.vellum-surface}"
    textColor: "{colors.trace-ink}"
    rounded: "{rounded.control}"
    padding: "4px 12px"
---

# Design System: Chipfire

## Overview

**Creative North Star: "The Station, Switched On"**

Chipfire's subject is a controlled detonation propagating through a lattice — accumulation, threshold, release. The visual world is the instrument that would sit in the room watching that happen: a seismograph and a blast-monitoring chart. It is still that instrument, but switched on. The first version was drawn as a printed form — cream paper, hairlines, square corners, almost no colour — and it read as a document about a game rather than a game. This version keeps the instrument and gives it a body and a pulse: a board in a housing, players bright enough to carry a game, and one big moment per cascade.

The system runs in exactly two states, never a blend. By day it is **vellum**: the cool green-grey of engineering chart paper. By night it is **phosphor**: a blue-black display ground where the players are lifted until they read as light, and orbs bloom slightly. Both are complete designs; neither is the other with the lights off.

Key Characteristics:
- The board is the screen. It sits in a housing (a bezel with a recessed well per cell), its frame takes the colour of whoever is to move, and nothing that doesn't help choose a move sits in its way.
- One saturated hue per player, and saturated colour appears nowhere else. Everything structural is ink, a tinted surface, or a hairline.
- Small, consistent radii on every object; hard edges only on charts, which are readings rather than objects.
- Motion is a reading, not decoration, with one loud exception that is still a reading: the cascade. Chains get a counter, coloured burst rings and, at length, a single frame flare. The afterglow never animates.
- Type is one variable family doing everything from a whisper to a shout: Archivo, expanded and heavy for moments, semi-condensed for instrument labels. IBM Plex Sans carries prose; IBM Plex Mono carries anything meant to be read character by character.

## Colors

Vellum and phosphor grounds, ink, and exactly four saturated hues that never appear anywhere except as player identity.

### Primary
- **Signal Rust** (#C0501E): the brand mark's core only. Never a player colour, even though it sits near vermilion; the mark has to stay legible as *the brand* independent of who is playing.

### Secondary — Player Identity (the system's only saturated colors)
Taken from the Okabe–Ito set, which was designed to stay distinct under the common colour-vision deficiencies. The previous orange and ochre were close enough that, for a deuteranope, only orb shape separated players 1 and 3.

- **Vermilion** (#D55E00) — Player 1, Jingga. Disc orbs. **Vermilion Ink** (#A94800) for words.
- **Blue** (#0067A8) — Player 2, Biru. Ring orbs. Clears text contrast unaided.
- **Reddish Purple** (#B4508C) — Player 3, Ungu. Diamond orbs. **Purple Ink** (#9A3F76) for words.
- **Bluish Green** (#00876A) — Player 4, Hijau. Triangle orbs. **Green Ink** (#00705A) for words.

### Neutral (vellum)
- **Ground** (#EEF2EF): the page.
- **Raised** (#E2E9E5): segmented-control tracks, stat tiles, code blocks, hover states.
- **Surface** (#F9FBF9): panels, cards, buttons — anything that is an object sitting on the ground.
- **Bezel** (#DCE4E0) and **Well** (#F5F8F6): the board's housing and the recess each cell sits in.
- **Lattice Line** (#D3DDD8): the printed grid where the page still shows one.
- **Trace Ink** (#13201B), **Soft** (#3F4F48), **Faint** (#55655E): text, in three steps that all clear AA.

### Phosphor (night)
Ground #0B1110, raised #18231F, surface #121B19, bezel #16201D, well #0F1715, ink #E4EDE9 / #A9B8B1 / #85958E. Players lift to #FF7B2E, #52AEFF, #EE8FCB and #2FD3A1, each clearing text contrast unaided, so the `-ink` tokens are set back to the identity colours. `--orb-glow` is 5px here and 0px by day, so one `drop-shadow` rule gives orbs a bloom at night and nothing on paper.

Applied by `prefers-color-scheme: dark` when there is no explicit choice, or forced either direction by the theme button through a `data-theme` attribute.

### Measured contrast
Recomputed from the live custom properties by `scripts/contrast.mjs` and asserted in CI by `tests/style/contrast.test.ts`, against all three grounds text is painted on (ground, raised, surface), in both schemes:

    vellum    trace 14.86 · soft 7.67 · faint 5.45   on ground
              trace 13.62 · soft 7.02 · faint 4.99   on raised
              trace 16.15 · soft 8.33 · faint 5.92   on surface
    phosphor  trace 15.96 · soft 9.24 · faint 6.07   on ground
              trace 13.54 · soft 7.84 · faint 5.15   on raised
              trace 14.70 · soft 8.51 · faint 5.59   on surface

Every player ink clears 4.5:1 everywhere; the floor across all 42 pairings is 4.71:1 (vermilion ink on vellum raised).

### Named Rules
**The One-Hue-Per-Player Rule.** Saturated colour exists for exactly one purpose — telling players apart. It never decorates a button, a chart axis, an icon, or a piece of chrome. The board frame and the active player's chip use it because they *are* statements about a player.

**The Shape-Before-Color Rule.** Every player colour is paired with a distinct orb silhouette (disc / ring / diamond / triangle) and every UI element that names a player repeats both. The lobby's player-count chips show the shapes before the first move, so they are learned rather than discovered.

## Typography

**Display, labels and numerals:** Archivo, variable on weight (100–900) and width (62–125%), self-hosted woff2.
**Body:** IBM Plex Sans (400/500), self-hosted.
**Mono:** IBM Plex Mono (400), self-hosted, not preloaded.

**Character:** One family with a width axis replaces a single-width display face. Expanded and heavy, Archivo makes a win or a ×12 chain the loudest thing on screen; semi-condensed, it sets instrument labels compactly without tiny, widely tracked capitals. Plex Sans is chosen for being unremarkable prose beside it.

### Hierarchy
- **Moment** (`.font-moment`: 850, 125% width, −0.02em, 0.95 leading; `text-6xl` up to 88px): the home headline, a winner's name, the chain counter, page titles. If everything is expanded, nothing is — reserve it.
- **Panel heading** (`.heading-panel`: 700, 105% width, 16px): a panel's title, one step above its labels.
- **Body** (400, 16px, 1.6): prose, rule text, captions at 13–15px.
- **Numeral** (`.font-numeral`, tabular figures): every counter, score and hash-adjacent number.
- **Label** (`.label-micro`: 650, 80% width, 12px, uppercase, 0.06em): field labels and instrument names. Rationed to one per group.
- **Mono** (400, 13px): connection codes, state hashes, cell notation.

### Named Rules
**The One Weight Above Rule.** A panel's title sits exactly one visual step above the labels inside it — larger and in sentence case, not louder tracking.

## Layout

Every page is one `max-w-6xl` column under a one-row **site bar** (mark, Main · Teka-teki · Tanding · Belajar, language, theme). Ulang is reached from where a code exists — the new-game lobby and the end of a game — not from the bar. On a phone the bar keeps one row: the mark without its name, the four links, and the theme button; the language switch moves to the footer.

The game screen reads top to bottom as a turn is taken: the **player bar** (one chip per player, the one to move lit in their colour with a "Giliran" tag), the **board**, the **readout** (what the move under the cursor would do), and the **toolbar** (undo, restart, change board, preview and sound; below `lg` also a speed button that cycles). At `lg` a 20rem **rail** sits beside it: the "Posisi ini" panel (load gauge, longest chain, moves played, cascade rewind, and the speed as a segmented control, since speed paces the rewind too) above a tabbed Rekaman / Langkah panel.

**The One-Width Rule.** Everything in the board's column is exactly as wide as the board. `--board-w` is computed once on `<main>`; the player bar, readout and toolbar cap at it, and at `lg` the grid is `--board-w` plus the rail, centred, with the title row and summary aligned to that total. The board is fitted to the viewport's height, so on a laptop it is often narrower than the column — and a board in a band of empty space under a wider player bar reads as a mistake.

The board is sized to fit the viewport (`(100dvh − chrome) × aspect-ratio`) so a tall board never forces a scroll to see the move about to be made. `--chrome` on `/main/` is 38 / 33 / 28rem (phone / `sm` / `lg`) and accounts for the site bar, the title row, the player bar, the readout and the toolbar; on `/tanding/` 33 / 28rem. On phones the column width almost always binds first (`CHROME-MEASUREMENTS.md`).

Spacing is a named scale: `2xs` 4px, `xs` 8px, `sm` 12px, `md` 16px, `lg` 24px, `xl` 40px, `2xl` 64px.

### Phase

`/main/` is phase-aware rather than mounting every instrument regardless of what's happening. `lib/phase.ts` derives one of four phases from state alone, never stored, never decided by a renderer:

- **`siap`** — before the first move. Mounts the lobby (ModePicker and Setup in one "Permainan baru" panel), where every choice applies at once and the empty board is the preview; mounts no reading, because there is nothing yet to read.
- **`main`** — a game in progress. Mounts the running readouts (LoadGauge, CascadeReplay, Seismogram, MoveList) and the toolbar, and not the configurator.
- **`longsor`** — the one turn immediately following a cascade of more than one generation. The same console as `main`, with the "Posisi ini" panel promoted: a full-weight border, the panel shadow and a ×n explosion reading, in place until the next move replaces it — because a phase is recomputed fresh every render, not remembered.
- **`selesai`** — game over. The winner's colour floods the board and the result card lands over it; mounts the summary and analysis panels; unmounts the mid-game controls that no longer apply.

The player bar (TurnIndicator) is the one exception to phase gating: it is mounted in every phase, because it says who moves first before a game and the final counts after one, and keeping it is what stops the board shifting down the page when play starts.

`/tanding/` does not use this `Phase` type — an incoming peer move would interrupt a re-watch, so `longsor` does not exist there — and gates far less by phase overall: a desync (or a peer offering their move list to replay) hides the board, TurnIndicator, and session details entirely rather than sitting above them, because a desync means the position on screen may be wrong.

**The Nothing-to-Say Rule.** An instrument with nothing to say for the current phase is not mounted — not disabled, not collapsed to a header, not shown empty. A phase-aware console quietly reverting to mounting everything, always, as new panels get added is the regression this rule exists to name.

**The Board-Never-Resizes Rule.** The board's rendered pixel size stays fixed across every phase transition within one session. A board that grows when the game ends is disorienting, and worse, it makes the final position look different from the position that was actually played — which the afterglow, a still reading of how that position was reached, depends on the cells it marks staying exactly where they were.

On a narrow viewport during `main`/`longsor`, the rail goes further: only the board, the player bar, the toolbar and the "Posisi ini" panel are on screen by default. LoadGauge and the Rekaman / Langkah tabs live in an in-flow drawer instead — see the One Overlay Rule below for why that drawer is not a second floating surface.

## Elevation & Depth

Depth by day is a tone and one soft shadow; by night it is tone and emission.

### Shadow Vocabulary
- **Panel shadow** (`shadow-panel`): the board housing, the active player chip, the promoted `longsor` panel, a hovered mode card. Not on every panel — a resting panel is a surface and a hairline.
- **Overlay lift** (`shadow-lg`): native `<dialog>`s only.
- **Orb glow** (`--orb-glow`): 0px by day, 5px by night.

### Named Rules
**The One Overlay Rule.** Only a native `<dialog>` floats above the page. The phone drawer expands in document flow; the toolbar sits in flow under the board; the win card sits inside the board's own box. A bottom sheet or popover is refused by this rule rather than argued about case by case.

## Shapes

Small, consistent radii on every object: cells 6px, controls 8px, panels 12px, the board housing 16px, chips and status dots fully round. Charts — the seismogram strip, the avalanche bars, the load track — keep their own shapes because they are readings, not objects.

### Named Rules
**The Consistent-Radius Rule.** A radius is chosen by what the thing is (cell, control, panel, housing), never by eye. Four values, and no fifth.

## Components

Shared classes live in `components/ui/styles.ts` and icons in `components/ui/Icon.tsx`. A component composes them and adds layout; it does not restate a button.

### Buttons
- **Primary** (`BUTTON_PRIMARY`): ink fill, ground text, 8px radius. Never more than one in view.
- **Secondary** (`BUTTON`): surface fill, hairline border that strengthens on hover.
- **Ghost** (`BUTTON_GHOST`) and **icon** (`BUTTON_ICON` / `BUTTON_ICON_ON`): the toolbar's presentation switches are icon buttons, always with an `aria-label`. On is an ink border on the raised tone, never a filled ink block — a filled switch is the brightest thing on a night screen.
- Focus-visible is one 2px offset ring in ink, app-wide.

### Segmented control (a Chipfire signature)
A raised track holding equal pills; the chosen one lifts onto the surface with a hairline shadow. Speed, AI level, and the Rekaman / Langkah tabs.

### Option cards
The lobby's choices — opponent, player count, board size — are cards that say what each option is. The chosen one gets an ink border and ring. Board-size cards draw the size to scale.

### Panels and stats
`PANEL`: surface, hairline, 12px radius, 16px padding. `PANEL_PROMOTED`: ink border plus the panel shadow, for `longsor`. `STAT`: a raised tile with the value in the moment face and its name beneath.

### The Board (signature component)
A housing (bezel, 16px radius, panel shadow) whose outline takes the colour of the player to move, and of the mover while their cascade plays. Each cell is a recessed well; an owned cell carries a faint wash of its owner's colour. Layers, in order: ownership wash, win flood, afterglow, capacity ticks (top-left corner, empty cells only), claim wash, burst ring (circular, 3px, in the mover's colour), orbs, last-move registration marks. A cell one orb from critical mass gets an inset ring in its owner's colour as well as the tremble. A chain of three or more shows a ×n counter that lands again each generation; eight or more flares the frame once. `mover` and `chain` come from the animation frames, which copy them from the event stream.

### Orbs (signature component)
SVG shapes (disc / ring / diamond / triangle) at fixed positions, radius 15 for up to four and 12 for five; 6+ falls back to a numeral.

### Theme toggle
One icon button in the site bar stepping through ikuti sistem → siang → malam, its label saying the current setting and what a press does. Display preference only: never in the move list, the hash, or on the wire.

## Do's and Don'ts

### Do:
- **Do** take every radius from the four tokens.
- **Do** pair every player-colour usage with that player's orb shape.
- **Do** use `.font-numeral` for every counter and `.font-moment` only for real moments.
- **Do** keep saturated colour scoped to the four player hues and the mark's rust core.
- **Do** build controls from `components/ui/styles.ts`.
- **Do** honour `prefers-reduced-motion`: every animation degrades to an instant, still, fully informative state.

### Don't:
- **Don't** shake the board. A moving board cannot be read, and reading it is the game.
- **Don't** use Signal Rust as a player colour.
- **Don't** animate the afterglow or add a decay to it.
- **Don't** derive a cascade animation's duration from the speed setting; only the delay between generations follows it.
- **Don't** add a floating surface other than a native `<dialog>`.
