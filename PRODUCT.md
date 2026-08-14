# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a visitor who wants to play a Chain Reaction-style strategy game, arriving via a link or search, in a browser, on desktop or mobile. Their job is to understand three simple rules quickly and play — hotseat with someone nearby, against an AI opponent solo, or peer-to-peer with a remote friend by exchanging a connection code. No account, no install, nothing to lose by trying it for thirty seconds.

Secondary, real but not designed for: technical reviewers (hiring managers, engineers) who read the same page and code as evidence of engineering ability — deterministic simulation, WebRTC P2P sync without a server, inspectable game-tree search AI. This audience is served by the game and code being genuinely correct and complete, not by separate content aimed at them. (Confirmed: player-first — see decision record below.)

## Product Purpose

Chipfire is a browser-playable implementation of Chain Reaction (formally the abelian sandpile model with territorial capture layered on top) with three ways to play: hotseat on one device, versus a local AI, and peer-to-peer between two browsers with no server anywhere. It exists to be a complete, deterministic strategy game that also happens to stand as a portfolio piece — the properties that make it a good game (determinism, no backend) are the same properties that make it worth building. Success: a stranger understands the rules from the board itself within five seconds, a game always plays to a valid completion with no crash and no desync, and nothing about the experience ever needed a server.

## Positioning

"Multiplayer game, no backend." Two browsers behind home routers establish a WebRTC data channel with signaling done entirely by the players — paste an offer code, paste an answer code, no account system, no matchmaking server, no relay. Only moves and a per-turn state hash cross the wire, never state itself, so the two peers' engines must independently agree turn by turn rather than trusting one side — determinism is provable, not assumed. A neighboring clone could copy the rules; it could not truthfully claim "no server anywhere" without the same engine discipline underneath.

## Operating Context

- Static export (Next.js `output: 'export'`), deployed to GitHub Pages under a `/chipfire` basePath, no runtime backend, no runtime fetches.
- Indonesian-first UI copy (`id` default locale), English secondary (`en`), full parity between the two.
- Three modes: **Hotseat** (2–4 players, one device, passing it around); **Versus AI** (1 human vs 1–3 AI, selectable difficulty, search running in a worker); **Peer-to-peer** (2 players, two devices, WebRTC data channel via manual paste-code signaling today — brokered signaling over PeerJS is planned but not shipped).
- A game is fully reconstructible from its move list; replay, undo, and P2P resync all derive from that one property rather than being built separately.
- No accounts, no server-side persistence. Local stats only, in `localStorage`.

## Capabilities and Constraints

- Rectangular board only in v1 — hex and toroidal boards are explicitly deferred; the neighbour function is pluggable so they are cheap later, never hardcoded now.
- Turn-based only; no real-time or timed modes (timers would change the sync model substantially).
- No matchmaking, lobbies, or public game list — connection is always by invitation (paste a code or share a link).
- No TURN relay: a documented fraction of P2P connections (symmetric NAT, strict corporate networks) will fail outright, and the product's job is to detect that fast, say so plainly, and offer hotseat — not to hide or apologize for the limitation.
- The AI gets no hidden information and no illegal moves; difficulty is search depth plus seeded noise, never a fabricated advantage.
- No ML anywhere in the AI.
- Terminology used consistently in UI copy and code: *orb*, *critical mass*, *cascade* / *avalanche*, *explode*, *capture*.
- Stated targets (PRD, not independently re-verified for this record): total JS ≤ 200 KB gzipped; Lighthouse performance and accessibility ≥ 95.

## Brand Commitments

- Name: **Chipfire**, from "chip-firing game," the graph-theory name for the core mechanic; used as the slug throughout.
- Maker credit is real, not placeholder: "Andi Fathul Mukminin," linked from every page footer to a real portfolio, GitHub, LinkedIn, and Instagram (`components/site/MakerSignature.tsx`).
- Voice: plain, short, and honest — including stating real limitations (the P2P failure case, an over-100% load reading once a game has ended) in ordinary language rather than smoothing them over.
- Indonesian-first copy is a binding product constraint, not a translation afterthought.

## Evidence on Hand

- The engine, AI, and P2P layer are real, tested code — 188 tests across rules, determinism, cascade, AI, net, and simulation as of this record — not a mockup or a demo shell.
- The maker's identity and social links are real and already live in the footer on every page.
- No case-study write-up, press mention, testimonial, or third-party endorsement exists. Do not invent one; if a future surface wants credibility content, it has to be sourced or left out.

## Product Principles

1. Determinism is load-bearing, not an implementation detail — replay, undo, AI search, and P2P sync all rest on it, and no convenience is worth breaking it.
2. Honesty over reassurance: state real limitations in plain language rather than hiding, apologizing for, or spinning them.
3. The rules are the whole pitch — three sentences and a five-second-legible board carry the product; that legibility is a design requirement, not marketing copy layered on top.
4. No server, ever, for gameplay — every feature is designed to work from a static export with the players' own devices as the only infrastructure.
5. Portfolio value is a side effect of doing the game right, not a target to design toward — the primary user is a player, not a reviewer (see Users).

## Accessibility & Inclusion

- Ownership must be readable without colour discrimination: every player colour pairs with a distinct orb shape, never colour alone.
- Contrast is measured, not eyeballed: text tokens are audited against both light and dark grounds, with a stated floor of 4.83:1.
- `prefers-reduced-motion` is honored throughout; cascade animation offers speed control and a reduced-motion fallback that resolves instantly with a summary of what happened.
