# Chrome measurement — build order step 1

Measured 2026-08-16, against the `main` branch running under `pnpm dev` (Next.js 14.2.15, `next dev`), with Chromium 148 (Playwright 1.60.0) as the browser. No code was changed to take these measurements. Full method in §5.

Per `DESIGN-REWORK.md` §10: *"Measure `--chrome` at three real phone sizes, both screens. Record the numbers. Do nothing else first."* This is that measurement, and nothing else.

## 1. What was measured

`PlayScreen.tsx:422-431` and `P2PScreen.tsx:241-248` each size the board with:

```
maxWidth: max(15rem, calc((100dvh - var(--chrome)) * cols/rows))
```

`--chrome` is a static CSS custom property, not derived from game state: `32rem` base / `27rem` at `sm:` (≥640px) / `17rem` at `lg:` (≥1024px) on `/main/`; `30rem` base / `25rem` at `sm:` on `/tanding/`. **None of the three required viewports (360, 390, 430px wide) reach the 640px `sm:` breakpoint**, so only the base constant (32rem / 30rem) is ever in effect at phone widths — the `sm:`/`lg:` overrides are untested here and irrelevant to a phone.

For each of the three viewports, both screens, and each phase reachable today (the codebase has no `Phase` type yet — every instrument always mounts regardless of state, per the audit and per `DESIGN-REWORK.md` §1 — so "phase" here means the game *state* the phase model will later gate on: no moves yet, a game in progress, immediately after a multi-generation cascade, and game over), the script recorded:

- the board's rendered pixel box (`[role="group"]`, the one element `Board.tsx` renders),
- `window.innerHeight` and `document.documentElement.scrollHeight`,
- which constraint actually bound the board's size — the `15rem` (240px) floor, the parent column's width, or the `--chrome` calc,
- whether the "readout" strip directly below the board (`PlayScreen.tsx:468`, the element the code's own budget comment calls out) is visible without scrolling — the literal claim the layout code makes in its comment at `PlayScreen.tsx:393-420`.

## 2. `/main/` (PlayScreen) results

| Viewport | Phase | Board (w×h px) | What bound the size | Real chrome (innerH − boardH) | Assumed chrome | Readout visible w/o scroll? | Slack below readout |
|---|---|---|---|---|---|---|---|
| 360×640 | siap | 240×161 | **15rem floor** | 479px (29.9rem) | 512px (32rem) | yes | 189px |
| 360×640 | main | 240×161 | **15rem floor** | 479px | 512px | yes | 229px |
| 360×640 | longsor | 240×161 | **15rem floor** | 479px | 512px | yes | 229px |
| 360×640 | selesai (3×3 board) | 240×240 | **15rem floor** | 400px | 512px | yes | 131px |
| 390×844 | siap | 358×239 | **container width** (358 = 390 − 2×16px padding) | 605px | 512px | yes | 314px |
| 390×844 | main | 358×239 | **container width** | 605px | 512px | yes | 355px |
| 390×844 | longsor | 358×239 | **container width** | 605px | 512px | yes | 355px |
| 390×844 | selesai (3×3 board) | 332×332 | **chrome calc** (332 < container's 358) | 512px | 512px (exact match — see §3) | yes | 243px |
| 430×932 | siap | 398×266 | **container width** (398 = 430 − 32px padding) | 666px | 512px | yes | 396px |
| 430×932 | main | 398×266 | **container width** | 666px | 512px | yes | 422px |
| 430×932 | longsor | 398×266 | **container width** | 666px | 512px | yes | 422px |
| 430×932 | selesai (3×3 board) | 398×398 | **container width** | 534px | 512px | yes | 271px |

`siap`/`main`/`longsor` are on the default 6×9 board (aspect 1.5); `selesai` used a 3×3 board (aspect 1, the fastest deterministic finish — see §5) so its numbers aren't directly comparable to the other three rows at the same viewport, only across viewports at the same phase.

## 3. `/tanding/` (P2PScreen) results

`longsor` is explicitly out of scope for `tanding` (`CLAUDE.md`, `DESIGN-REWORK.md` §3: an incoming peer move would interrupt a re-watch, so the phase doesn't exist there). `selesai` was not driven to completion empirically — see §5 for why — but is addressed analytically below.

| Viewport | Phase | Board (w×h px) | What bound the size | Real chrome | Assumed chrome |
|---|---|---|---|---|---|
| 360×640 | pre-connect | *(no board — see below)* | — | — | — |
| 360×640 | siap (connected, no moves) | 240×161 | **15rem floor** | 479px | 480px (30rem) |
| 360×640 | main (2 moves played) | 240×161 | **15rem floor** | 479px | 480px |
| 390×844 | pre-connect | *(no board)* | — | — | — |
| 390×844 | siap | 358×239 | **container width** | 605px | 480px |
| 390×844 | main | 358×239 | **container width** | 605px | 480px |
| 430×932 | pre-connect | *(no board)* | — | — | — |
| 430×932 | siap | 398×266 | **container width** | 666px | 480px |
| 430×932 | main | 398×266 | **container width** | 666px | 480px |

**Pre-connect has no board at all.** `P2PScreen.tsx:138-154` only mounts `<Board>` once `game.connected` is true — before that, `[role="group"]` doesn't exist in the DOM; the whole viewport is `ConnectPanel`. This isn't a chrome-measurement question, it's a mount question, and it was already known from static reading — confirmed here rather than newly discovered.

**Board size is identical to `/main/`'s at every viewport tested**, despite `/tanding/`'s different `--chrome` constant (30rem vs 32rem). At all three widths the binding constraint is the 15rem floor or the container, never the chrome calc, so the 2rem difference between the two screens' assumed budgets currently has **zero effect** on rendered board size.

**`selesai` was not driven to completion on `/tanding/`.** `P2PScreen` has no `Setup` control — the board is fixed at the default 6×9, 2-player config for the whole session — and finishing a 6×9 game legitimately (eliminating a player from 54 cells) takes far more moves than the 3×3 board's 3-click deterministic finish used for `/main/`'s `selesai` row. Analytically: the only elements conditionally mounted above the board on `/tanding/` are the desync report and the offered-moves banner (`P2PScreen.tsx:173-217`), both unrelated to `selesai` — a finished game shows the same `ConnectPanel`-collapsed header, `MoveAnnouncer`, `TurnIndicator`, and turn banner as `main`, just with different text in the turn banner (`"X menang"` instead of `"Giliranmu"`/`"Giliran lawan"`, same element, `P2PScreen.tsx:223-235`). So `selesai`'s real chrome on `/tanding/` should equal the measured `main` row — but this is inference from reading the code, not a browser measurement, and is flagged as such.

## 4. What this means for the assumed constants

1. **At all three phone widths, for both screens, in every phase measured, the `--chrome` calc never binds the board's rendered size.** It's always either the `15rem` floor (at 360px) or the parent column's own width (at 390px and 430px). The one exception is `/main/`'s `selesai` row at 390×844, where the calc does bind (332px, less than the 358px the container would otherwise allow) — and there, because the calc is the actual constraint, the real and assumed chrome trivially coincide (512px = 512px): that's the formula matching itself, not new evidence that 32rem is correct.
2. **Practical consequence:** the 32rem/30rem constants, unverified as they are, are not currently costing the board any size at 360, 390, or 430px width in `siap`/`main`/`longsor` — a smaller, more accurate `--chrome` wouldn't grow the board there, because something else (floor or container) is already the tighter limit. The one place today's constant visibly costs board size is `/main/`'s `selesai` phase at 390×844 (332px vs the 358px the container would allow — a ~7% narrower board than necessary).
3. **The board+readout combination fits without scrolling at every measured configuration** (`readoutFitsInViewport: true` throughout) — the promise `PlayScreen.tsx:393-420`'s comment makes ("a tall board never forces a scroll to see the move about to be made") holds today at these three sizes. But there's substantial unused vertical space below the readout in every case — 131px to 422px of slack before the fold — because the board is rendered smaller than the true available height would allow (bound by floor/container instead). The rest of the rail (controls, seismogram, move list, etc.) is below the fold in every configuration tested, which the code's own comment says is intentional.
4. **The `PlayScreen.tsx` budget comment doesn't sum to its own constant.** Its line-by-line accounting (page padding 3rem + header ~3rem + gap 1.25rem + turn indicator ~6rem + gap 1.25rem + gap 0.75rem + readout 3.25rem + footer ~4rem) totals ~22.5rem (360px), not the 32rem (512px) the constant actually reserves — a ~9.5rem (152px) gap between the comment's own math and the value it's justifying, independent of anything a browser measurement could confirm or refute.
5. **`100dvh` in headless Chromium behaved as `window.innerHeight`** with no dynamic browser-toolbar shrinkage — real mobile Safari/Chrome reserve extra space for an address bar that can appear/disappear mid-session, which this measurement cannot reproduce. These numbers are a **best case**; a real phone with its toolbar visible has less usable height than what's reported here, meaning the slack in item 3 is an upper bound, not a guarantee.

## 5. Method

- Local `pnpm dev` server, `BASE_PATH` unset (default `/chipfire`), accessed at `http://localhost:3000/chipfire/id/main/` and `.../id/tanding/`.
- Playwright (Chromium), one fresh page per phase, `localStorage.clear()`'d before navigation, the auto-opening "Cara main" `<dialog>` dismissed via Escape before interacting.
- `siap`/`main`/`longsor` on `/main/` used the default 6×9, 2-player board. `selesai` used the smallest legal board (3×3, `MIN_ROWS`/`MIN_COLS` in `lib/engine/board.ts`) via the in-page `Setup` form, reaching game-over in exactly 3 clicks (place at index 0 twice with an intervening opponent move at index 1 — the second placement at 0 crosses its critical mass, explodes, and eliminates the opponent's only orb, ending the game via sole-survivor).
- `longsor` (a 2-generation cascade) was reached on the default board by alternately stacking an interior cell (index 13, critical mass 4) and the edge cell directly above it (index 4, critical mass 3) one below their own thresholds, using a far corner (index 53) to pass the opponent's turns harmlessly, then placing the interior cell's 4th orb — its explosion sheds into the primed edge cell, which explodes in the next generation. Confirmed via the in-page readout ("2 ledakan" / "Rantai terpanjang: 2").
- `/tanding/` was driven to a genuinely connected state with two Playwright browser contexts performing the real manual offer/answer/confirm exchange through `ConnectPanel` (`components/game/useP2PGame.ts`, `lib/net/*` — read only, not modified), including real WebRTC ICE gathering over the loopback interface. This succeeded without a STUN/TURN dependency being an issue in this environment.
- No file in the repository was modified to produce these numbers. The measurement script itself lives outside the repo, in the session scratchpad, and was not committed.
