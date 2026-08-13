import type { Config } from 'tailwindcss'

/**
 * Semantic tokens only — PRD §12. Components never use raw hex.
 *
 * Nothing here holds a literal value any more. Every colour, size and space
 * below dereferences a custom property declared in app/globals.css, which is
 * the single place the scales are decided. A value that appears in both files
 * will eventually disagree in both files.
 *
 * The player colours are the only saturated elements on screen and are chosen
 * to stay distinguishable under common colour-vision deficiencies. Colour is
 * still never the sole ownership signal; orb arrangement carries it too.
 *
 * Each player has two values, and the distinction matters:
 *
 *   DEFAULT — the identity colour, exactly as the PRD fixes it. Used for orbs
 *             and borders, which are large shapes rather than text.
 *   ink     — the same hue darkened until it clears 4.5:1 on both chart grounds.
 *             Used wherever the colour carries *words*. Ochre at #B08721 is
 *             2.76:1 on chart stock: legible as a diamond, not as a name.
 */

/** Tailwind's slash-opacity syntax needs the channel form, not a finished
 *  colour — `border-trace/30` becomes `rgb(31 36 33 / 0.3)` only if the var
 *  holds bare channels. See the colour block in globals.css. */
const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`
const config: Config = {
  /*
   * lib/ has to be scanned. The player colour classes exist only as string
   * literals in lib/players.ts, and Tailwind generates nothing it has not
   * literally seen — so without this glob `bg-p1`, `text-p1` and every `-ink`
   * variant are silently absent from the stylesheet and every orb falls back
   * to inheriting the body's trace ink. Colour is half of PRD §12's ownership
   * signal; shape was carrying it alone.
   */
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    /*
     * Replaced, not extended. Extending would leave Tailwind's own ramp
     * reachable alongside this one, and `text-5xl` silently resolving to an
     * off-scale size is exactly the drift a scale exists to prevent. Each
     * entry pairs a size with the leading it is meant to be set at, so a
     * caller gets the right rhythm without having to remember to ask.
     */
    fontSize: {
      '2xs': ['var(--text-2xs)', { lineHeight: 'var(--leading-flat)' }],
      xs: ['var(--text-xs)', { lineHeight: 'var(--leading-snug)' }],
      sm: ['var(--text-sm)', { lineHeight: 'var(--leading-snug)' }],
      base: ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
      lg: ['var(--text-lg)', { lineHeight: 'var(--leading-normal)' }],
      xl: ['var(--text-xl)', { lineHeight: 'var(--leading-snug)' }],
      '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-tight)' }],
      '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
      '4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-tight)' }],
    },
    extend: {
      colors: {
        chart: {
          DEFAULT: token('chart'),
          deep: token('chart-deep'),
          line: token('chart-line'),
        },
        // The ink ramp. Three steps, and the floor is WCAG AA on chart stock —
        // hierarchy is carried by size, weight and tracking, never by fading
        // text below the threshold where it can be read at all.
        trace: {
          DEFAULT: token('trace'), // 13.1:1
          soft: token('trace-soft'), //  6.9:1
          faint: token('trace-faint'), // 5.1:1
          /*
           * Named alphas for chrome. These bake their opacity in rather than
           * accepting a slash modifier, which is the point: `border-trace-rule`
           * is a decision about what kind of line this is, and `border-trace/27`
           * is a decision about nothing. The board keeps the slash syntax,
           * where the alphas carry game state instead of trim.
           */
          wash: 'rgb(var(--color-trace) / var(--alpha-wash))',
          hairline: 'rgb(var(--color-trace) / var(--alpha-hairline))',
          rule: 'rgb(var(--color-trace) / var(--alpha-rule))',
          data: 'rgb(var(--color-trace) / var(--alpha-data))',
        },
        /* The sandpile plate's four heights. Level 0 is the paper itself and
           is never painted, which halves the shapes the picture needs. */
        plate: {
          1: 'rgb(var(--color-trace) / var(--alpha-plate-1))',
          2: 'rgb(var(--color-trace) / var(--alpha-plate-2))',
          3: 'rgb(var(--color-trace) / var(--alpha-plate-3))',
        },
        /*
         * The brand mark's core, and only the mark's. The brand rules fix it:
         * the tile inverts on dark and the outer orbs follow, but the rust core
         * never changes — so it cannot be a player colour, which the board is
         * free to reassign. Deliberately not p1's #C4561E; they are neighbours
         * and are not the same value.
         */
        mark: token('mark'),
        p1: { DEFAULT: token('p1'), ink: token('p1-ink') }, // signal orange
        p2: { DEFAULT: token('p2'), ink: token('p2-ink') }, // station blue
        p3: { DEFAULT: token('p3'), ink: token('p3-ink') }, // ochre
        p4: { DEFAULT: token('p4'), ink: token('p4-ink') }, // slate green
      },
      // Named alongside Tailwind's numeric scale rather than replacing it:
      // `gap-lg` states a rhythm, `gap-3` states a measurement.
      spacing: {
        '2xs': 'var(--space-2xs)',
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
      },
      maxWidth: {
        measure: 'var(--measure)',
      },
      lineHeight: {
        flat: 'var(--leading-flat)',
        tight: 'var(--leading-tight)',
        snug: 'var(--leading-snug)',
        normal: 'var(--leading-normal)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        tremble: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(0.6px, -0.4px)' },
          '50%': { transform: 'translate(-0.5px, 0.5px)' },
          '75%': { transform: 'translate(0.4px, 0.5px)' },
        },
        // The win moment: the one place the app is allowed to be pleased with
        // itself. A single settle, not a loop.
        settle: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // A cell releasing its orbs. The ring expands past the cell edge, so
        // at the faster speeds successive generations overlap and the chain
        // reads as one wave travelling outward rather than as cells blinking.
        burst: {
          '0%': { transform: 'scale(0.45)', opacity: '0.5' },
          '100%': { transform: 'scale(1.15)', opacity: '0' },
        },
        // A cell changing hands, washed in the colour of whoever just took it.
        // Capture is the point of the game and nothing on the board said so.
        claim: {
          '0%': { opacity: '0.45' },
          '70%': { opacity: '0.2' },
          '100%': { opacity: '0' },
        },
        // Orbs arriving. Small enough to register as weight, not as bounce.
        arrive: {
          '0%': { transform: 'scale(0.72)', opacity: '0.5' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        // The only ambient motion in the app, and it encodes real danger:
        // this cell is one orb away from critical mass.
        tremble: 'tremble 260ms ease-in-out infinite',
        settle: 'settle 220ms ease-out both',
        // Fixed durations rather than durations derived from the speed setting:
        // at 'cepat' the frames advance faster than these run, and the overlap
        // is what makes a long chain look like one propagating event. `both`
        // rather than `forwards`: cells further from the move carry a ripple
        // delay (Board.tsx), and without it they'd sit at full strength for
        // that delay before jumping to the starting keyframe.
        burst: 'burst 300ms ease-out both',
        claim: 'claim 420ms ease-out both',
        arrive: 'arrive 180ms ease-out',
      },
    },
  },
  plugins: [],
}

export default config
