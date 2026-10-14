/**
 * The control vocabulary, once.
 *
 * Every screen used to restate its own button string — `border
 * border-trace-rule px-3 py-1.5 transition-colors hover:bg-chart-deep` in a
 * dozen spellings — so a change to what a button looks like was a change to a
 * dozen files that would drift apart the first time one was missed. These are
 * the only definitions; components compose them and add layout.
 *
 * Literal strings, not built ones: Tailwind generates only the classes it can
 * see written out, and `components/` is in its content glob.
 */

/** A secondary action: quiet surface, hairline border. */
export const BUTTON =
  'control-target inline-flex items-center justify-center gap-2 rounded-ctl border border-trace-hairline bg-surface px-3 py-2 text-sm font-medium text-trace transition-colors hover:border-trace-rule hover:bg-chart-deep disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-trace-hairline disabled:hover:bg-surface'

/** The way forward. There is never more than one on screen. */
export const BUTTON_PRIMARY =
  'control-target inline-flex items-center justify-center gap-2 rounded-ctl border border-trace bg-trace px-5 py-2 text-sm font-semibold text-chart transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40'

/** A borderless action that sits in running text or under a primary. */
export const BUTTON_GHOST =
  'control-target inline-flex items-center justify-center gap-2 rounded-ctl px-3 py-2 text-sm font-medium text-trace-soft transition-colors hover:bg-chart-deep hover:text-trace disabled:cursor-not-allowed disabled:opacity-40'

/** A square icon button. Always paired with an aria-label. */
export const BUTTON_ICON =
  'control-target-square inline-flex items-center justify-center rounded-ctl border border-trace-hairline bg-surface text-trace transition-colors hover:border-trace-rule hover:bg-chart-deep disabled:cursor-not-allowed disabled:opacity-40'

/** The same icon button, switched on. */
export const BUTTON_ICON_ON =
  'control-target-square inline-flex items-center justify-center rounded-ctl border border-trace bg-trace text-chart transition-opacity hover:opacity-90'

/**
 * A segmented control: one track, options as equal pills, the chosen one
 * lifted onto the surface. Reads as one instrument with a selector rather than
 * several loose buttons — DESIGN.md's signature, in the new material.
 */
export const SEGMENTED = 'inline-flex gap-0.5 rounded-[10px] bg-chart-deep p-[3px]'
export const SEGMENT =
  'inline-flex min-h-[2.25rem] flex-1 items-center justify-center rounded-[7px] px-3 text-sm text-trace-soft transition-colors hover:text-trace'
export const SEGMENT_ON = 'bg-surface font-semibold text-trace shadow-[0_1px_2px_rgb(0_0_0/0.12)]'

/** A panel on the ground. */
export const PANEL = 'rounded-panel border border-trace-hairline bg-surface p-4'

/** A panel with something to say right now (the `longsor` cluster). */
export const PANEL_PROMOTED = 'rounded-panel border border-trace bg-surface p-4 shadow-panel'

/** A numbered reading in a tile: the value large, the name small beneath. */
export const STAT = 'flex flex-col gap-0.5 rounded-ctl bg-chart-deep px-3 py-2'
