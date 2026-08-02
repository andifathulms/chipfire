# PRD — Rantai

**Chain Reaction: a grid strategy game of cascading explosions. Hotseat, AI opponent, and browser-to-browser multiplayer with no server anywhere.**

> *rantai* (Indonesian) — chain. *Reaksi berantai* is the standing Indonesian term for a chain reaction.
> Rename freely; the slug is used throughout as `rantai`.

| | |
|---|---|
| **Status** | Draft — pre-implementation |
| **Owner** | Andi Fathul Mukminin Salahuddin |
| **Type** | Personal portfolio project, open source |
| **Deployment** | GitHub Pages (static export, no server) |
| **Language** | Indonesian-first UI; English secondary |

---

## 1. The game

A grid. Two or more players. Three rules:

1. On your turn, place one orb in an empty cell or a cell you already own.
2. Every cell has a **critical mass** equal to its count of orthogonal neighbours — 2 in corners, 3 on edges, 4 in the interior. On reaching it, the cell **explodes**: it sheds one orb to each neighbour, and **every cell receiving an orb converts to the exploding player's colour**.
3. Explosions can push neighbours over their own critical mass, cascading. You win when every orb on the board is yours.

The conversion rule is the entire game. A single placement can flip territory you never touched. Corners detonate cheapest but reach only two cells; interiors cost twice as much and hit four. That tension is the strategy, and it produces a characteristic rhythm — long quiet accumulation, then one move that sweeps the board.

## 2. Why build it

**As a portfolio piece it demonstrates things a CRUD app cannot:** deterministic simulation, NAT traversal and WebRTC data channels, peer-to-peer state synchronisation without an authority, and game AI with search. "Multiplayer game, no backend" invites the question *how?*, and the answer is the demonstration.

**It is also the cheapest of the current project set to ship.** Small integer grid, a queue, no assets, no data acquisition, no domain research, no external API. Hotseat alone is playable in a weekend. Compared to Lontara (needs a reviewer), Rinci (needs regulation transcription), and Pangkas (needs a rendering spike), this one has no long-lead dependency at all.

**And cascades look good in five seconds** — which makes it usable as content, not just as a repository link.

## 3. Non-goals

- **No accounts, no profiles, no persistent ranking.** Local stats only.
- **No matchmaking, no lobbies, no public game list.** These need a server. Connection is by invitation: paste a code or share a link.
- **No spectators, no replays-as-a-service.** Local replay export is in; hosting replays is not.
- **No real-time or timed modes in v1.** Turn-based only; timers change the sync model substantially.
- **No hex, triangular, or toroidal boards in v1.** The neighbour function is pluggable so these are cheap later, but rectangular ships first.
- **No monetisation, no ads, no analytics on gameplay.**
- **No TURN relay.** See §7 — a fraction of connections cannot work peer-to-peer, and that is an accepted, disclosed limitation rather than a problem to solve with a paid server.
- **No ML.** The AI is search plus a hand-written evaluation function, fully inspectable.

## 4. Modes

| Mode | Players | Needs |
|---|---|---|
| **Hotseat** | 2–4, one device, passing it around | Nothing. Ships first. |
| **Versus AI** | 1 human, 1–3 AI at selectable strength | Search running in a worker |
| **Peer-to-peer** | 2, two devices | WebRTC data channel |

Hotseat and AI cover the entire product for a solo visitor. P2P is the technical showcase.

## 5. Rules — precise specification

Ambiguity here becomes desync later, so the model is fixed:

- **Board.** `rows × cols`, default 6×9. Configurable within bounds.
- **Cell.** `{ owner: PlayerId | null, count: int }`.
- **Critical mass.** `neighbours(cell).length`. Derived from the board topology, never hardcoded.
- **Legal move.** Cell is empty, or `cell.owner === currentPlayer`.
- **Placement.** `count += 1`, `owner = currentPlayer`.
- **Explosion.** A cell with `count >= criticalMass` explodes: `count -= criticalMass`, and each neighbour gets `count += 1` and `owner = explodingPlayer`. Note the subtraction — the cell is **not** zeroed. This matters and is a classic implementation bug.
- **Cascade order.** Breadth-first over an explicit FIFO queue, cells enqueued in a fixed scan order. Never recursion, never `Set` iteration order, never `Object.keys`. Determinism depends on this.
- **Elimination.** A player with zero orbs on the board is out — **but only after they have taken at least one turn.** Skipping this guard eliminates everyone on move one.
- **Victory.** One player remains with orbs.
- **Cascade termination.** A cascade can, in principle, run forever once one player owns the whole board. The engine **checks the victory condition inside the cascade loop and halts immediately** when only one player has orbs. There is also a hard iteration budget as a backstop; hitting it is a bug and is reported as one, never swallowed.

## 6. Determinism — the load-bearing property

Every mode depends on this, and P2P is impossible without it.

**`applyMove(state, move) → { state, events }` is a pure function.** Same state plus same move yields byte-identical results on any device, any browser, any time. No clock, no `Math.random` outside a seeded PRNG carried in the state, no floating point, no iteration over unordered collections.

**A game is its move list.** State is always reconstructible by replaying moves from the seed. This gives replay, undo in hotseat, desync recovery, and shareable games for free — one property, four features.

**Events, not diffs.** The cascade emits an ordered event stream — `place`, `explode`, `convert`, `eliminate`, `win`. Animation replays that stream. Nothing in the renderer decides what happened; it only decides how to draw it.

## 7. Peer-to-peer

**The problem.** Two browsers behind home routers cannot find each other. Each needs the other's SDP blob — addresses, fingerprints, candidate routes — exchanged *before* any connection exists. WebRTC deliberately leaves this "signaling" step unspecified. That is the loophole.

**Layer 1 — manual paste (must work standalone).** Player A generates an offer, the app renders it as a compressed code and a QR image. A sends it via WhatsApp, SMS, or read aloud. B pastes it, gets an answer code, sends it back. Two exchanges and the channel is open. **The players are the signaling server.** Zero infrastructure, zero third-party dependency, and it cannot rot.

**Layer 2 — brokered signaling (convenience only).** A public broker such as PeerJS reduces this to sharing a short ID. Better UX, but it is a third-party service that can rate-limit, break, or vanish. It is sugar over Layer 1 and never the only path. If it fails, the UI falls back to paste without ceremony.

**STUN is fine, TURN is out.** A public STUN server is needed for address discovery and is a trivial dependency. But roughly 10–20% of connections — symmetric NAT, strict corporate networks — cannot establish a direct path at all and would need a TURN relay, which is a paid server and outside the constraint. **Some connections will simply fail.** Detect it, say so plainly, offer hotseat. Do not pretend otherwise.

**No authority means no referee.** Each browser holds its own state. Both apply the same moves through the same pure function, so a **state hash is exchanged every turn**. A mismatch means desync: stop immediately, say so, and offer to resync by replaying the move list. Silent divergence is the worst possible failure — two players playing different games without knowing.

**Disconnection is not recoverable without planning.** No server holds the state. On drop, the app offers to export the move list as a code so the game can be resumed in a fresh session.

## 8. AI

Not an afterthought — it is what makes the game playable by a visitor with no second person.

**Search.** Minimax with alpha-beta over the move list. Branching factor is the number of legal cells, which is large early and shrinks as ownership consolidates. Iterative deepening with a time budget rather than a fixed depth.

**Evaluation.** Hand-written and inspectable:
- orb count difference
- cell count difference
- possession of corners and edges, weighted by their low critical mass
- **vulnerability**: owning a cell at `criticalMass - 1` adjacent to an enemy cell also at `criticalMass - 1` is a liability, since the opponent moves first
- cascade potential: the size of the chain a move would trigger

**Difficulty is depth plus noise**, not cheating. The AI sees exactly what the player sees. Easy adds seeded randomness to move selection; hard searches deeper. **Never give the AI hidden information or illegal moves** — there is nothing hidden in this game, so any advantage would be pure fabrication.

**Runs in a worker** with a time budget, so the UI never blocks.

## 9. Features

### 9.1 Board and cascade animation
The signature moment. Orbs animate outward along the event stream, cell by cell, so a long cascade *reads* as a chain rather than a flicker. Speed control, because a 40-step cascade at full animation is slow and at no animation is incomprehensible. Honour `prefers-reduced-motion` with instantaneous resolution and a summary of what happened.

### 9.2 Cascade preview (optional toggle)
Hover or long-press a legal cell to see how far the resulting cascade would reach, without committing. This is a teaching aid and a genuine strategic tool; it is also exactly the sort of thing no existing Chain Reaction clone offers. Off by default in P2P unless both players agree.

### 9.3 Replay and share
A finished game is its move list, so it exports as a short code. Load a code and step through the game move by move. Shareable by URL hash.

### 9.4 Connection panel
Honest about state: generating, waiting, connected, failed. On failure, name the likely cause and offer hotseat. Never spin forever.

### 9.5 Local stats
Games played, win rate by mode, longest cascade triggered. localStorage. No server, no leaderboard.

### 9.6 Board configuration
Size, player count, colours, and a small set of presets. Colours must be distinguishable under common colour-vision deficiencies — this is a game where ownership *is* the state, so colour is not decorative.

## 10. Architecture

Static Next.js 14 App Router export. No backend, no runtime fetches.

```
move
  → applyMove (pure)  → { state, events }
                      → renderer replays events
                      → hash exchanged with peer
                      → move appended to the game's move list
```

**The engine is pure and lives alone.** `lib/engine` imports nothing from React, Next, the DOM, or the network. It is the only place that knows the rules.

**Topology is pluggable.** `neighbours(index, board)` is the single source of truth for adjacency, and critical mass derives from it. This is what makes hex or toroidal boards a later addition rather than a rewrite.

**AI and search run in a worker.** Never on the main thread.

**Networking is a thin transport.** The data channel carries moves and hashes, nothing else. No game logic lives in the network layer — if the transport knows the rules, the design is wrong.

**State is never sent over the wire.** Only moves. Sending state invites divergence and hides desync instead of exposing it.

## 11. Testing

**Rules fixtures.** Hand-authored boards with a stated move and stated resulting board. Cover: the `count -= criticalMass` subtraction, corner versus interior thresholds, conversion on receipt, first-turn elimination guard, and multi-step cascades.

**Determinism property.** Replaying a move list from the seed reproduces the final state byte-identically, asserted across a large corpus of generated games.

**Cascade termination.** Adversarial boards deliberately constructed near the runaway condition. The engine must halt via the victory check, and the iteration backstop must never be the thing that stops it.

**Cross-instance agreement.** Two independent engine instances fed the same move list produce identical hashes at every turn. This is the P2P sync guarantee, tested without any networking.

**AI sanity.** The AI never plays an illegal move; higher difficulty beats lower difficulty over a match series; search respects its time budget.

**Simulation.** Thousands of random legal games run to completion, asserting no crash, no infinite cascade, and a valid terminal state every time.

## 12. Design direction

The subject is a controlled detonation propagating through a lattice — accumulation, threshold, release. The material world is the **seismograph and the blast-monitoring chart**: a fine grid, ink traces, a station clock, everything precise and instrumented rather than arcade.

**Palette.** Chart stock `#EDEAE3` as ground with a hairline grid printed on it. Trace ink `#1F2421` for lines, borders, and text. Player colours are the only saturated elements on the screen and must survive colour-vision deficiency: signal orange `#C4561E`, station blue `#2C5F87`, ochre `#B08721`, slate green `#3E6B5A`. Ownership is state, so every player colour is paired with a distinct orb arrangement — never colour alone.

**Type.** Numerals matter — orb counts, critical mass, cascade length — so **Space Grotesk** for display and counters, mechanical with distinctive figures. **IBM Plex Sans** for UI and prose. Connection codes and hashes in **IBM Plex Mono**, because they are meant to be read character by character and pasted accurately.

**Structure.** The grid is printed, not drawn — a fixed hairline lattice that exists before the game starts, the way chart paper does. Cells sit in it rather than being it. Orbs cluster inside a cell in fixed positions, so count is readable at a glance without counting.

**Motion.** One orchestrated moment, and it is the whole product: the cascade propagating outward, cell to cell, in event order, with a slight ease so the chain has rhythm. A cell at `criticalMass - 1` trembles very slightly — the only ambient motion in the app, and it encodes real information about danger.

**Copy.** Indonesian first, plain and short. The connection panel says exactly what is happening, including *"Koneksi langsung tidak berhasil. Sebagian jaringan memang tidak mendukung."* — honest, unapologetic, with hotseat offered right there.

## 13. Milestones

| | | |
|---|---|---|
| **M0** | Scaffold | Static export deploying to Pages. Trivial here; do it anyway. |
| **M1** | Engine | Board model, neighbours, `applyMove`, cascade with victory check, event stream, elimination guard. Rules fixtures green. Console only. |
| **M2** | Hotseat | Board rendering, cascade animation, turn handling, win state. **Playable and shippable.** |
| **M3** | AI | Minimax, evaluation, difficulty levels, worker. Solo-playable. |
| **M4** | P2P manual | Data channel, offer/answer paste, QR, move exchange, hash verification, desync detection. The technical showcase. |
| **M5** | P2P brokered | PeerJS layer over M4, with fallback to paste on any failure. |
| **M6** | Polish | Replay export, cascade preview, stats, board config, a11y, reduced motion. |

Ship publicly at M2. M3 makes it visitable; M4 makes it a portfolio piece.

## 14. Success criteria

- Move-list replay reproduces final state byte-identically across 10,000 generated games.
- Two engine instances agree on every turn hash across the full corpus.
- No cascade ever terminates by hitting the iteration backstop.
- Hard AI beats easy AI over a series; neither ever plays an illegal move.
- P2P connects on common home networks; failures are detected and explained within a few seconds rather than hanging.
- Fully playable offline (hotseat and AI) after first load.
- Total JS ≤ 200 KB gzipped. Lighthouse performance and accessibility ≥ 95.
- A cascade is legible at default speed to someone who has never seen the game.

## 15. Deployment

`output: 'export'`, `basePath` matching the repository name, `images.unoptimized`, `trailingSlash: true`, `.nojekyll` in the output root. Verify under the production `basePath` with `pnpm preview` before pushing.

## 16. Risks

| Risk | Mitigation |
|---|---|
| **Runaway cascade hangs the browser.** | Victory check inside the cascade loop, plus an iteration backstop that is treated as a bug signal. Adversarial fixtures from M1. |
| **Silent desync — two players in different games.** | Move-only transport, per-turn hash exchange, halt-and-report on mismatch. Never auto-reconcile by trusting one side. |
| **P2P fails for some users and looks broken.** | Documented as a real limitation. Fast failure detection, plain explanation, hotseat always available. Manual paste never depends on a third party. |
| **PeerJS or any public broker disappears.** | Layer 2 is optional sugar. Layer 1 must work standalone, and is tested standalone. |
| **The `count -= criticalMass` bug.** | Explicit fixture. It is the single most common implementation error in this game and it produces plausible-looking wrong play. |
| **Cascade animation too slow to enjoy or too fast to follow.** | Speed control from M2, tuned against real long cascades rather than short test ones. |
| **Scope creep into a game platform.** | §3 is binding. Lobbies, ranking, and accounts are a different project with a server. |
