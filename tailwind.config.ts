import type { Config } from 'tailwindcss'

/**
 * Semantic tokens only — PRD §12. Components never use raw hex.
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
 *
 * Every value below was measured against #EDEAE3 and #E3DFD5, not eyeballed.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        chart: {
          DEFAULT: '#EDEAE3',
          deep: '#E3DFD5',
          line: '#D6D1C4',
        },
        // The ink ramp. Three steps, and the floor is WCAG AA on chart stock —
        // hierarchy is carried by size, weight and tracking, never by fading
        // text below the threshold where it can be read at all.
        trace: {
          DEFAULT: '#1F2421', // 13.1:1
          soft: '#4A504B', //    6.9:1
          faint: '#5E635E', //   5.1:1
        },
        p1: { DEFAULT: '#C4561E', ink: '#A34719' }, // signal orange
        p2: { DEFAULT: '#2C5F87', ink: '#2C5F87' }, // station blue — passes as-is
        p3: { DEFAULT: '#B08721', ink: '#7B5F17' }, // ochre
        p4: { DEFAULT: '#3E6B5A', ink: '#3E6B5A' }, // slate green — passes as-is
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
      },
      animation: {
        // The only ambient motion in the app, and it encodes real danger:
        // this cell is one orb away from critical mass.
        tremble: 'tremble 260ms ease-in-out infinite',
        settle: 'settle 220ms ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
