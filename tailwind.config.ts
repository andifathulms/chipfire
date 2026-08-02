import type { Config } from 'tailwindcss'

/**
 * Semantic tokens only — PRD §12. Components never use raw hex.
 * The player colours are the only saturated elements on screen and are chosen
 * to stay distinguishable under common colour-vision deficiencies. Colour is
 * still never the sole ownership signal; orb arrangement carries it too.
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
        trace: {
          DEFAULT: '#1F2421',
          soft: '#5B615C',
          faint: '#8C918C',
        },
        p1: '#C4561E', // signal orange
        p2: '#2C5F87', // station blue
        p3: '#B08721', // ochre
        p4: '#3E6B5A', // slate green
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
      },
      animation: {
        // The only ambient motion in the app, and it encodes real danger:
        // this cell is one orb away from critical mass.
        tremble: 'tremble 260ms ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
