# CLAUDE.md — Chipfire

Chain Reaction: grid strategy game with cascading explosions. Hotseat, AI opponent, and WebRTC peer-to-peer multiplayer. Static site, GitHub Pages, no backend, no server anywhere.

Read `PRD.md` before starting any task. It fixes scope; this file describes how to work in the repo.

**One property carries this entire project: determinism.** `applyMove` must produce byte-identical results on any device, any browser, any time. Replay, undo, AI search, and peer-to-peer sync all rest on it. Any nondeterminism anywhere in the engine breaks all four at once, and breaks them silently.

---

## Stack

- Next.js 14, App Router, `output: 'export'` — static only
- TypeScript, `strict: true`
- Tailwind CSS
- Vitest
- pnpm
- PeerJS for brokered signaling **only** — optional layer, never a hard dependency
- No game framework, no physics engine, no state library

## Commands

```bash
pnpm dev
pnpm build                 # static export to ./out
pnpm preview               # serve ./out under the production basePath
pnpm test                  # vitest watch
pnpm test:run              # vitest once — before every commit
pnpm test:determinism      # replay + cross-instance agreement (slow); before any engine commit
pnpm test:sim              # thousands of random games to completion
pnpm typecheck
pnpm lint
```

## Layout

```
app/
  [locale]/                # id (default), en
    main/                  # hotseat + AI
    tanding/               # P2P
    ulang/                 # replay viewer
components/
  board/                   # grid, cells, orbs
  cascade/                 # event-stream animation player
  connect/                 # offer/answer paste, QR, status
  hud/                     # turn indicator, stats
lib/
  engine/                  # THE CORE. Pure. No React, no DOM, no clock, no network.
    board.ts               # board model, indexing
    topology.ts            # neighbours() — single source of adjacency truth
    apply.ts               # applyMove: the pure function everything depends on
    cascade.ts             # BFS queue resolution + victory check
    events.ts              # event types
    hash.ts                # deterministic state hash
    replay.ts              # move list → state
  ai/                      # minimax, alpha-beta, evaluation. Pure.
  net/                     # transport only. Knows nothing about rules.
    signal.ts              # offer/answer encode/decode, compression
    channel.ts             # data channel send/receive
    sync.ts                # hash exchange, desync detection
workers/
  ai.worker.ts             # the only runtime caller of lib/ai
tests/
  rules/                   # hand-authored board fixtures
  determinism/
  cascade/                 # adversarial near-runaway boards
  sim/
```

## Invariants

1. **`applyMove(state, move) → { state, events }` is pure and deterministic.** No clock, no `Date`, no `Math.random`, no `crypto.getRandomValues`, no floating point, no module-level mutable state. Randomness only via a seeded PRNG carried inside the state.

2. **Never iterate an unordered collection in engine code.** No `Set` iteration, no `Object.keys`, no `Map` order dependence, no `Array.sort` without a total comparator. Cascade order comes from an explicit FIFO queue with a fixed scan order. This is the most likely source of cross-device divergence and it will not show up in single-machine testing.

3. **Cascade uses an explicit queue, never recursion.** Recursion blows the stack on exactly the long cascades that make this game interesting.

4. **An exploding cell subtracts its critical mass. It is not zeroed.** `count -= criticalMass`. This is the single most common bug in Chain Reaction implementations and it produces play that looks plausible and is wrong. There is a fixture for it; do not "simplify" it away.

5. **The victory check runs inside the cascade loop.** A cascade can run forever once one player owns everything. Halt the moment only one player has orbs. The iteration backstop exists as a safety net and hitting it is a bug to report, never a normal exit path.

6. **Elimination only applies after a player has taken a turn.** Without this guard everyone is eliminated on move one.

7. **Critical mass derives from `neighbours()`.** Never hardcode 2/3/4, never branch on "is this a corner". Topology is the single source of truth, which is what keeps hex and toroidal boards cheap later.

8. **The engine imports nothing from React, Next, `components/`, the DOM, or `lib/net`.** No browser globals.

9. **A game is its move list.** State is always reconstructible by replay from the seed. Never persist or transmit derived state as the source of truth.

10. **Only moves and hashes cross the wire. Never state.** Sending state hides desync instead of exposing it. `lib/net` is transport: if it contains rules logic, the design is wrong.

11. **Hash every turn; halt on mismatch.** Desync is reported to both players immediately with an option to resync by replaying the move list. Never auto-reconcile by trusting one side. Silent divergence is the worst outcome this project can produce.

12. **Manual paste signaling must work with no third party.** PeerJS is optional sugar over it. Test Layer 1 standalone; any failure in Layer 2 falls back to paste without ceremony.

13. **The AI gets no hidden information and no illegal moves.** Nothing is hidden in this game, so any AI advantage would be fabricated. Difficulty is search depth plus seeded noise, nothing else.

14. **AI runs in a worker with a time budget.** Never on the main thread.

15. **Animation replays the event stream.** The renderer never decides what happened, only how to draw it. If a component computes a game outcome, that logic belongs in the engine.

16. **Player identity is never colour alone.** Every player colour pairs with a distinct orb arrangement. Ownership is the game state, so it must be readable without colour discrimination.

## Working style

- **Engine before UI, always.** Rules fixtures first, then implement. The UI is easy; the engine is where the bugs are expensive and invisible.
- **When a determinism test fails, stop and find the source.** Do not retry, do not add a tolerance, do not reseed. A nondeterminism that is "usually fine" will desync a real game at the worst moment.
- **Small increments.** Hotseat fully working beats three modes half-working.
- **Don't touch `next.config.js` or the Actions workflow without saying so explicitly.**
- **Don't add dependencies** for game logic, state, search, or animation. PeerJS is the only permitted network dependency and only for Layer 2.
- **Never weaken a test to make something pass**, especially in `tests/determinism/` or `tests/cascade/`.
- **Ask before changing the rules model.** Board topology, elimination timing, and cascade ordering touch the engine, the AI, the sync protocol, and every fixture at once.

## Conventions

- Named exports; defaults only where Next requires them.
- Discriminated unions for events and moves, keyed on `type`. Exhaustive `switch` with a `never` default — this is how a new event type surfaces every renderer that must handle it.
- No `any`. No non-null `!` in engine code.
- Board as a flat typed array indexed `row * cols + col`. Not a 2D array of objects — flat is faster for AI search and trivially serialisable.
- Integers only in the engine. No floats anywhere, including in evaluation scoring — use integer weights.
- Comments explain *why*, and are worth writing around the cascade loop and the subtraction rule specifically.
- Tailwind utilities inline; semantic tokens in `tailwind.config.ts` — `chart`, `trace`, and player colours `p1`–`p4`. Never raw hex in components. See PRD §12.
- Indonesian first in UI copy, plain and short.

## Testing rules

- `pnpm test:run` before every commit; `pnpm test:determinism` before any commit touching `lib/engine` or `lib/ai`.
- New rule behaviour → a hand-authored board fixture with stated input and stated output.
- Any engine change → replay property and cross-instance agreement must both stay green.
- New cascade behaviour → an adversarial near-runaway fixture.
- AI change → illegal-move assertion, time-budget assertion, and a difficulty-ordering match series.
- Bug fix → failing test first.
- `pnpm test:sim` before any release: thousands of random games to completion, no crash, no runaway, valid terminal state every time.

## Deployment

`main` builds and deploys via Actions. `basePath` must match the repository name; `.nojekyll` must exist in `out/`. Verify with `pnpm preview` before pushing — asset 404s under the subpath do not reproduce in `pnpm dev`.

## Current state

M0–M4 done, plus most of M6. Deploys to Pages via `.github/workflows/deploy.yml`.

- **M1 engine** — `lib/engine` complete. Rules fixtures, cascade termination, replay and cross-instance agreement, 3000-game simulation all green.
- **M2 hotseat** — playable. Board, cascade animation off the event stream, speed control, undo, board config.
- **M3 AI** — minimax with alpha-beta and iterative deepening in `workers/ai.worker.ts`. Difficulty is depth plus seeded noise.
- **M4 P2P manual** — offer/answer paste with compressed codes, per-turn hash exchange, halt-and-report on desync with an explicit resync. **QR encoding is not implemented** — codes are copy/paste only.
- **M5 brokered signalling (PeerJS)** — not started. Layer 1 works standalone, which is the point.
- **M6 polish** — replay viewer, share codes, local stats, and cascade preview are in. The preview is **always on in `main` and absent from `tanding`**; §9.2 asks for an explicit toggle, off by default in P2P unless both agree, and that toggle does not exist.

Beyond the milestones, four things that follow from the concept rather than from the category:

- **Cascade re-watch** — the last avalanche can be replayed generation by generation (`useCascadeReview`). Hotseat and AI only; in P2P an incoming move would interrupt it.
- **Move list during play** — `summariseMoves` derives one line per move from the record. Derived, never accumulated, which is what keeps undo and an adopted peer history correct without bookkeeping.
- **Load reading** — `lib/engine/load.ts`. Orbs against the lattice's resting capacity, plus a count of primed cells. A reading about the system, never advice about a move.
- **Divergence report** — `lib/engine/diverge.ts` localises a desync to the first turn two move lists disagree, and separates "a message went missing" from "one of these engines is wrong". The second is reported as a bug with an instruction not to resync.
- **Avalanche distribution** — `lib/stats.ts` buckets every cascade by doubling ranges. Stats schema is v2; v1 and the pre-rebrand key are read forward.
- **Evaluation inspector** — `explainScores` in `lib/ai/evaluate.ts` breaks the score into named terms. Deliberately not shared with `scores`, which runs in the alpha-beta inner loop; a test asserts they agree.
- **Puzzles** (`/teka`) — `lib/puzzle.ts` finds positions with exactly one winning move by seeded search. Uniqueness is decided by `previewMove`, not estimated by search, so there is no depth caveat. Seeds are fixed and asserted in tests.
- **Post-mortem** — `lib/ai/postmortem.ts` answers "on which turn did I lose". The turning point is the **last turn at which any move was still scored in the player's favour**, not the largest regret — regret is denominated in scores containing the win weight, so the biggest number always lands near the end and reports a symptom as a cause. Runs in the worker (invariant 14 has no analysis exemption) on its own instance, since the opponent's worker only exists in AI mode. Two-player games only. **Every claim must quote its search depth**; the panel does, in both locales.
- **Sound** — `lib/sound.ts`, synthesised through Web Audio, no assets and no dependency. It is a second renderer of the event stream, hanging off `useCascadePlayer` so every animating surface sounds alike: one tone per cascade generation, pitch climbing a semitone each, capped at two octaves. Off by default; the context is created by the click that enables it. Elimination is not sounded yet.

Next, in order: QR for the connection codes, the preview toggle §9.2 actually specifies, then PeerJS as optional sugar over the paste flow.
