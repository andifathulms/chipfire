export type RGB = [number, number, number]

export interface ContrastCheck {
  scheme: 'light' | 'dark'
  token: string
  ground: string
  ratio: number
}

export const GLOBALS_CSS_PATH: string

export function relativeLuminance(rgb: RGB): number
export function contrastRatio(a: RGB, b: RGB): number
export function readPalettes(
  cssPath?: string,
): { light: Record<string, RGB>; dark: Record<string, RGB> }
export function buildChecks(palettes: {
  light: Record<string, RGB>
  dark: Record<string, RGB>
}): ContrastCheck[]
