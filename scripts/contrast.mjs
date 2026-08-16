/**
 * WCAG contrast ratios for every text and player-identity token, computed
 * against the two backgrounds they're actually painted on — chart stock
 * (the ground) and chart stock deep (the raised/grouped surface) — for both
 * the light palette and the night palette in app/globals.css.
 *
 * The palette's own comments assert these numbers by hand. This recomputes
 * them from the live CSS custom properties, so a token edit that quietly
 * changes a ratio is caught rather than trusted. Run directly for a report:
 *
 *   node scripts/contrast.mjs
 *
 * Or import { checks, contrastRatio } for a test to assert against.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const GLOBALS_CSS_PATH = join(__dirname, '..', 'app', 'globals.css')

function srgbToLinear(channel) {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance([r, g, b]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

export function contrastRatio(rgbA, rgbB) {
  const a = relativeLuminance(rgbA)
  const b = relativeLuminance(rgbB)
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}

const DARK_MARKER = '@media (prefers-color-scheme: dark)'

function parseColorTokens(section) {
  const tokens = {}
  const re = /--color-([a-z0-9-]+):\s*(\d+)\s+(\d+)\s+(\d+)/gi
  let match
  while ((match = re.exec(section)) !== null) {
    tokens[match[1]] = [Number(match[2]), Number(match[3]), Number(match[4])]
  }
  return tokens
}

/** { light: {name: [r,g,b]}, dark: {name: [r,g,b]} }, read straight from globals.css. */
export function readPalettes(cssPath = GLOBALS_CSS_PATH) {
  const css = readFileSync(cssPath, 'utf8')
  const darkIndex = css.indexOf(DARK_MARKER)
  if (darkIndex === -1) throw new Error(`${DARK_MARKER} not found in ${cssPath}`)
  const light = parseColorTokens(css.slice(0, darkIndex))
  // The dark block only redefines colours that change; anything absent keeps
  // its light value (none currently, but this is the correct fallback rule).
  const dark = { ...light, ...parseColorTokens(css.slice(darkIndex)) }
  return { light, dark }
}

/**
 * Every text-carrying token against every ground it is actually painted on.
 * Player identity hues (p1, p3) are deliberately excluded from the AA floor —
 * DESIGN.md documents them as orbs/large-marks only, not text — only their
 * -ink variants (and p2/p4, which pass through unchanged) have to clear it.
 */
const GROUNDS = ['chart', 'chart-deep']
const TEXT_TOKENS = ['trace', 'trace-soft', 'trace-faint', 'p1-ink', 'p2-ink', 'p3-ink', 'p4-ink']
const AA_FLOOR = 4.5

export function buildChecks(palettes) {
  const checks = []
  for (const [scheme, tokens] of Object.entries(palettes)) {
    for (const ground of GROUNDS) {
      for (const name of TEXT_TOKENS) {
        if (!(name in tokens) || !(ground in tokens)) continue
        const ratio = contrastRatio(tokens[name], tokens[ground])
        checks.push({ scheme, token: name, ground, ratio })
      }
    }
  }
  return checks
}

function report() {
  const palettes = readPalettes()
  const checks = buildChecks(palettes)
  const width = Math.max(...checks.map((c) => c.token.length))
  console.log(`WCAG contrast — computed from ${GLOBALS_CSS_PATH}\n`)
  for (const scheme of ['light', 'dark']) {
    console.log(`${scheme}:`)
    for (const check of checks.filter((c) => c.scheme === scheme)) {
      const pass = check.ratio >= AA_FLOOR ? 'OK ' : 'FAIL'
      console.log(
        `  ${pass}  ${check.token.padEnd(width)}  on ${check.ground.padEnd(10)}  ${check.ratio.toFixed(2)}:1`,
      )
    }
  }
  const floor = checks.reduce((min, c) => Math.min(min, c.ratio), Infinity)
  console.log(`\nfloor across every pairing checked: ${floor.toFixed(2)}:1`)
  const failing = checks.filter((c) => c.ratio < AA_FLOOR)
  if (failing.length > 0) {
    console.log(`\n${failing.length} pairing(s) below the ${AA_FLOOR}:1 AA floor.`)
    process.exitCode = 1
  }
}

// Only run the report when invoked directly (`node scripts/contrast.mjs`),
// not when imported by a test.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  report()
}
