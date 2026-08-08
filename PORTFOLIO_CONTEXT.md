# PORTFOLIO_CONTEXT — Chipfire

Raw material for a client-facing case study. Everything below is drawn from the repository
itself (source, tests, `git log`, CI config), not from the PRD's aspirations. Where the PRD
and the code disagree, the code wins and the disagreement is noted.

Repository: `github.com/andifathulms/chipfire` (public, MIT) — working directory still named
`rantai`, the pre-rebrand name.

---

## 1. One-line summary

A browser game of chain-reaction explosions on a grid — play locally against a friend or an AI,
or connect two devices directly to each other over the internet with no server involved at all.

---

## 2. The problem

Chain Reaction is a well-known grid game, and there are dozens of clones. Two things are wrong
with almost all of them, and both are what this project addresses:

**The rules are usually implemented wrong.** The defining move — a cell that reaches capacity
*subtracts* its capacity rather than emptying — is subtly incorrect in most implementations. The
result still looks like a working game, plays plausibly, and is simply a different game. It is a
bug that never announces itself.

**Multiplayer means a server.** Every online version needs a backend: a lobby, a matchmaker, an
authoritative game server, and the hosting bill that comes with them. That is the cost that keeps
small games from having an online mode at all.

Chipfire is built for two audiences at once. For a player: a fast, offline-capable game they can
learn in two minutes and play against a friend on another device without an account. For a
technical reader — the intended portfolio audience — it is a demonstration that "multiplayer, no
backend" is a real answer to a real constraint, and an invitation to ask *how*.

---

## 3. My role

Sole author and architect. Every line in `lib/`, `components/`, `app/`, `workers/`, and `tests/`
was written for this project — 6,700 lines of TypeScript across 26 commits, from the empty
directory to a deployed site. That includes the PRD that fixed the scope and the engineering
rules that constrained the implementation.

**Built from scratch, no libraries:**
- The rules engine — board model, adjacency, cascade resolution, victory and elimination logic,
  event stream, deterministic hash, replay (`lib/engine/`, 984 lines)
- The AI — minimax with alpha-beta pruning, iterative deepening, hand-written position
  evaluation (`lib/ai/`, 300 lines)
- The peer-to-peer layer — WebRTC session negotiation, compressed connection codes, data-channel
  transport, per-turn desync detection (`lib/net/`, 404 lines)
- The cascade animation player, which replays the engine's event stream rather than computing
  anything itself (`components/cascade/`)
- The visual design system — chart-paper and seismograph palette, typography, colour-vision-safe
  player identity (`tailwind.config.ts`, `app/globals.css`)
- 70 test cases across 15 files, including a 3,000-game simulation harness

**Used as-is:** Next.js, React, Tailwind, Vitest, TypeScript. The browser's own WebRTC,
`CompressionStream`, and `localStorage` APIs. Google's public STUN servers (address discovery
only — no data passes through them). Space Grotesk and IBM Plex, self-hosted.

**Written with AI assistance.** Commits carry a `Co-Authored-By: Claude` trailer. The
architecture, the invariants, the rules model, and the test strategy are mine and are documented
in `PRD.md` and `CLAUDE.md`; the implementation was produced against those constraints. Worth
deciding deliberately how to present this — the constraint documents are themselves strong
evidence of engineering judgement.

---

## 4. Technical approach

**One property carries the whole project: determinism.** `applyMove(state, move)` is a pure
function that produces byte-identical results on any device, any browser, any time. No clock, no
randomness outside a seeded generator carried inside the state, no floating-point arithmetic
anywhere — integers only, including in the AI's scoring.

That single property buys four features at once. Because the same moves always produce the same
game, **a game *is* its move list**: replay, undo, shareable game codes, and peer-to-peer sync all
fall out of it for free. Nothing derived is ever stored or transmitted as truth.

**No server, and no referee either.** In peer-to-peer play, each browser holds its own copy of the
game. Only moves and a hash of the resulting position cross the wire — never the position itself.
Both sides run the same pure function on the same moves, and compare hashes every turn. A mismatch
means the two players have silently drifted into different games, which is the worst possible
failure here, so the app **stops immediately and says so**, and offers to rebuild from the move
list. It never quietly picks a winner.

**The players are the signalling server.** Two browsers behind home routers can't find each other;
each needs the other's connection details before any connection exists, and WebRTC deliberately
leaves that step unspecified. Chipfire renders those details as a compressed, pasteable code. One
code out over WhatsApp, one code back, and the channel opens — with zero infrastructure and
nothing that can be shut down or rate-limited. A third-party broker is planned as *optional* sugar
on top, never as the only path.

**Ordering is a rule, not an implementation detail.** The cascade resolves through an explicit FIFO
queue in a fixed neighbour scan order — never recursion (which would blow the stack on exactly the
long cascades that make the game interesting) and never iteration over a `Set` or object keys,
which is the single most likely source of cross-device divergence and which will not show up in
single-machine testing.

**Capacity is derived, never hardcoded.** A cell's critical mass *is* its neighbour count, read
from one adjacency function. Nothing branches on "is this a corner." That is what makes hex or
wrap-around boards a later addition rather than a rewrite.

**Strict layering.** The engine imports nothing from React, Next, the DOM, or the network layer.
The network layer knows transport and nothing about rules. The renderer decides *how* to draw,
never *what happened*. The AI runs in a Web Worker on a time budget, so search never blocks the
interface.

**Honest about failure.** Roughly 10–20% of connections — strict corporate networks, certain NAT
configurations — cannot establish a direct peer-to-peer path without a paid relay server. That is
disclosed in plain Indonesian in the connection panel, with local play offered right there, rather
than papered over with a spinner.

---

## 5. Actual tech stack

Verified against `package.json` — three runtime dependencies, total.

| | |
|---|---|
| **Runtime deps** | `next@14.2.15`, `react@18.3.1`, `react-dom@18.3.1` — that is the entire list |
| **Language** | TypeScript 5.5, `strict: true`, no `any` |
| **Styling** | Tailwind CSS 3.4 with custom semantic tokens; no component library |
| **Testing** | Vitest 2.0 |
| **Package manager** | pnpm 9.15 |
| **Build** | Next.js App Router, `output: 'export'` — fully static, no server runtime |
| **Hosting** | GitHub Pages via GitHub Actions |
| **Browser APIs used directly** | WebRTC (`RTCPeerConnection`, data channels), `CompressionStream`/`DecompressionStream` (deflate-raw), Web Workers, `localStorage` |

**Not used, despite appearing in the PRD:** PeerJS. It is listed as the planned brokered-signalling
layer and is not a dependency — the manual paste path works standalone, which was the point of
building it first. There is no game framework, no physics engine, no state-management library, no
animation library, and no search or AI library. All of that is hand-written.

---

## 6. Notable features

- **Peer-to-peer play with no server.** Two devices connect directly by exchanging a compressed
  code over any channel the players already have. Board size and seed travel with the offer;
  everything after that is moves only.
- **Per-turn desync detection.** A 32-bit FNV-1a hash of the full game state is exchanged every
  turn. On mismatch the game halts and reports it to both players, with an explicit rebuild-from-
  move-list option — no silent reconciliation, ever.
- **AI opponent in a worker.** Minimax with alpha-beta pruning and iterative deepening under a time
  budget, scoring positions on orb and cell advantage, corner and edge control, and *vulnerability*
  (owning a nearly-full cell next to an enemy nearly-full cell, since the opponent moves first).
  Three difficulties at search depths 1 / 3 / 6, weakened only by seeded noise — the AI never gets
  hidden information or an illegal move.
- **Move preview that cannot lie.** Hovering a legal cell shows exactly how far the resulting chain
  would reach and which cells would change hands, computed by running the real move through the
  real engine on a throwaway copy — not by a second, approximate implementation of the rules.
- **Interactive tutorial on the live engine.** Five scripted lessons (placing, reaching the limit,
  capturing, the chain reaction, winning) played on real board positions whose stated outcomes are
  asserted in the test suite — so the tutorial can never teach something the game doesn't do.
- **Replay and shareable game codes.** A finished game exports as a short code — a header plus one
  byte per move — that reconstructs every position by replay. Load a code, step through the game.
- **Cascade animation driven by the event stream.** The engine emits ordered `place` / `explode` /
  `convert` / `eliminate` / `win` events grouped into waves; the renderer replays them with speed
  control, honouring `prefers-reduced-motion`.
- **Accessibility as a rules constraint.** Ownership *is* the game state, so every player colour is
  paired with a distinct orb arrangement — never colour alone. Full keyboard navigation on the
  board; all ink values raised to WCAG AA.
- **Indonesian-first, bilingual.** `id` default, `en` secondary, both statically exported.

---

## 7. Challenges and tradeoffs

**Determinism was chosen as a hard constraint before any code was written**, and it is genuinely
restrictive: no `Date`, no `Math.random`, no floats, no iteration over unordered collections
anywhere in the engine. The cascade uses a `Uint8Array` of positional flags where a `Set` would be
the obvious choice, specifically because `Set` iteration order is exactly the kind of
nondeterminism that would desync two peers and never show up in local testing. The AI takes its
clock as an injected function so the time budget is testable without waiting for real time —
`lib/ai` stays pure. The comments in `lib/engine/cascade.ts` exist to stop a future reader from
"simplifying" any of this away.

**No TURN relay — an accepted, disclosed failure.** A meaningful fraction of connections cannot be
established peer-to-peer without a relay server, which costs money and would break the no-backend
premise. The decision was to detect the failure quickly, explain it plainly in the UI, and offer
local play — rather than solve it with infrastructure or hide it behind an endless spinner.

**Manual paste before brokered signalling, deliberately.** The convenience layer (PeerJS) is the
easier and flashier build. It was postponed on purpose so the zero-dependency path would be the
one that actually ships and gets tested standalone. It remains unbuilt — which means the connection
flow is more work for players today, and also means nothing in the product can be broken by a third
party disappearing.

**Rebrand mid-project, handled properly.** The project shipped as *Rantai* and was renamed to
*Chipfire* (commit `2144277`) after recognising that the mechanic is formally the chip-firing game
/ abelian sandpile model — and that the two rules most often implemented wrong are the *defining
properties* of that model rather than incidental details. The rename migrates both `localStorage`
keys with a legacy fallback so returning players keep their stats and don't get the tutorial
reopened at them, and deliberately leaves Indonesian copy alone: *rantai* is simply the word for
chain, and it's what a player would search for. Good detail for a case study on handling a rename
without breaking users.

**A visual redesign roughly halfway through.** Commits `d738875` and `f1deaab` rebuilt the play
screen around the board as the hero and carried it through every remaining screen — 640 lines
changed across the two. `54f0518` fixes a subtle Tailwind bug where player colours vanished in the
production build because `lib/` wasn't in the class-scan path: a class-name failure that only
appears once the build starts tree-shaking CSS.

**Scope that grew for a good reason.** The tutorial (`/belajar`) and the how-to-play panel are not
in the PRD. They were added on the observation that the game's central mechanic — one orb in a
corner sweeping a third of the board — is invisible to a new player until they've seen it happen.
The tutorial's claims are asserted in tests, so it cannot drift from the engine.

**CI as the determinism gate.** Every deploy runs typecheck, lint, and the full suite — including
the 3,000-game simulation and cross-instance agreement — before it builds. Determinism is the
property everything rests on, so it gates releases rather than running on demand. The workflow also
verifies the static export produced `.nojekyll` and the locale routes, because asset 404s under the
Pages subpath do not reproduce in local development.

**Documentation drift worth knowing about:** `CLAUDE.md` and `README.md` both still state that the
cascade preview is unbuilt. It is built (`lib/engine/preview.ts`, commits `24d2568` and `b8ffc8c`)
and tested. QR encoding of connection codes and PeerJS brokered signalling are genuinely still
outstanding.

---

## 8. Status

**Live and deployed.** Pushes to `main` build and deploy to GitHub Pages via
`.github/workflows/deploy.yml`, gated on typecheck, lint, and the full test suite.

**Public repository**, MIT licensed: `github.com/andifathulms/chipfire`.

**Production, not prototype**, for the three modes that exist. Local hotseat (2–4 players), the AI
opponent, peer-to-peer via pasted codes, the replay viewer, shareable game codes, local stats, and
the tutorial are all complete and playable. Milestones M0–M4 and most of M6 are done. Outstanding:
QR encoding for connection codes, and PeerJS brokered signalling (M5).

Marked in the PRD as a personal portfolio project, open source, with no monetisation, no accounts,
and no gameplay analytics.

---

## 9. Metrics

| | |
|---|---|
| **Commits** | 26, all on `main` |
| **Time span** | 2 Aug 2026 22:34 → 3 Aug 2026 20:24 (+08:00) — under 24 hours end to end |
| **Total TypeScript** | ~6,700 lines across 66 `.ts`/`.tsx` files |
| **Engine** | 984 lines (`lib/engine/`, 12 modules) — the deterministic core |
| **AI** | 300 lines (`lib/ai/`) + a 39-line worker |
| **Networking** | 404 lines (`lib/net/`) |
| **UI** | 2,870 lines (`components/`, 18 components) + 239 lines of routes |
| **Tests** | 1,281 lines, 70 test cases across 15 files — 19% of the codebase |
| **Simulation coverage** | 3,000 randomly generated games run to completion every CI run |
| **Runtime dependencies** | 3 (`next`, `react`, `react-dom`) |
| **Routes** | 5 pages × 2 locales — home, `/main` (play), `/tanding` (P2P), `/ulang` (replay), `/belajar` (tutorial) |
| **Backend services** | 0. Two public STUN servers for address discovery; no data passes through them |

The compressed timeline is real and is worth framing deliberately: the PRD, the engineering
constraints, and the test strategy were written first, and the implementation followed them. The
sequencing is visible in the commit history — `docs` → `scaffold` → `engine` → `tests` → `hotseat`
→ `ai` → `net` → UI polish.

---

## 10. Suggested screenshots

1. **Mid-cascade on the play screen** — the signature moment, and the one that makes the game
   legible in a still image. Capture a long chain in progress, with the turn indicator and orb
   counts visible. Ideally paired with an animated capture; a 5-second cascade is the single best
   asset this project has.
   → [components/game/PlayScreen.tsx](components/game/PlayScreen.tsx), [components/board/Board.tsx](components/board/Board.tsx), [components/cascade/useCascadePlayer.ts](components/cascade/useCascadePlayer.ts)

2. **The connection panel, mid-exchange** — this is the "no backend" claim made visible. Show the
   generated offer code in monospace, grouped for reading, with the honest status text. Best single
   image for the technical part of the case study.
   → [components/connect/ConnectPanel.tsx](components/connect/ConnectPanel.tsx), [components/game/P2PScreen.tsx](components/game/P2PScreen.tsx)

3. **Move preview on hover** — a legal cell hovered, with the projected chain's reach and captured
   cells highlighted before committing. Shows a feature no other Chain Reaction clone offers, and
   demonstrates that the engine is cheap enough to run speculatively.
   → [components/board/Board.tsx](components/board/Board.tsx), [lib/engine/preview.ts](lib/engine/preview.ts)

4. **The replay viewer stepping through a shared game** — a game code loaded, the position
   reconstructed, step controls visible. This is the "a game is its move list" argument in one
   image.
   → [components/game/ReplayScreen.tsx](components/game/ReplayScreen.tsx), [lib/share.ts](lib/share.ts)

5. *(optional, if a fifth is useful)* **A tutorial lesson** — shows the teaching layer and the
   Indonesian-first copy at the same time.
   → [components/game/TutorialScreen.tsx](components/game/TutorialScreen.tsx), [lib/tutorial.ts](lib/tutorial.ts)

Shoot at the default 6×9 board with 2 players so the palette reads clearly, and include at least
one capture showing the distinct orb *arrangements* — the accessibility decision is easier to point
at than to describe.
