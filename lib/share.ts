import { MAX_COLS, MAX_PLAYERS, MAX_ROWS, MIN_COLS, MIN_PLAYERS, MIN_ROWS } from './engine/board'
import type { GameRecord } from './engine/replay'
import { normaliseSeed } from './engine/prng'

/**
 * A finished game is its move list, so it shares as a short code — no server,
 * no stored replay (PRD §9.3). The code is the game: paste it back and the
 * engine reconstructs every position by replay.
 *
 * Layout: version, rows, cols, players, seed (4 bytes little-endian), then one
 * byte per move index. The largest board is 12×14 = 168 cells, so an index
 * always fits in a byte.
 */
export const RECORD_VERSION = 1

export class RecordCodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RecordCodeError'
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

export function encodeRecord(record: GameRecord): string {
  const { config, moves } = record
  const bytes = new Uint8Array(8 + moves.length)
  const view = new DataView(bytes.buffer)

  bytes[0] = RECORD_VERSION
  bytes[1] = config.rows
  bytes[2] = config.cols
  bytes[3] = config.players
  view.setUint32(4, normaliseSeed(config.seed), true)

  moves.forEach((move, position) => {
    if (move < 0 || move > 0xff) throw new RecordCodeError(`move index out of range: ${move}`)
    bytes[8 + position] = move
  })

  return toBase64Url(bytes)
}

export function decodeRecord(code: string): GameRecord {
  const cleaned = code.trim().replace(/\s+/g, '')
  if (cleaned.length === 0) throw new RecordCodeError('kode kosong')

  let bytes: Uint8Array
  try {
    bytes = fromBase64Url(cleaned)
  } catch {
    throw new RecordCodeError('kode rusak')
  }

  if (bytes.length < 8) throw new RecordCodeError('kode terpotong')
  if (bytes[0] !== RECORD_VERSION) throw new RecordCodeError('versi kode berbeda')

  const rows = bytes[1]
  const cols = bytes[2]
  const players = bytes[3]
  if (rows < MIN_ROWS || rows > MAX_ROWS) throw new RecordCodeError('ukuran papan tidak sah')
  if (cols < MIN_COLS || cols > MAX_COLS) throw new RecordCodeError('ukuran papan tidak sah')
  if (players < MIN_PLAYERS || players > MAX_PLAYERS) {
    throw new RecordCodeError('jumlah pemain tidak sah')
  }

  const seed = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true)
  const moves: number[] = []
  const cells = rows * cols

  for (let position = 8; position < bytes.length; position += 1) {
    const move = bytes[position]
    // Validated here so the replay viewer fails on the code, not mid-game.
    if (move >= cells) throw new RecordCodeError('langkah di luar papan')
    moves.push(move)
  }

  return { config: { rows, cols, players, seed }, moves }
}

/** Shareable by URL hash — the code travels in the link, nothing is hosted. */
export function shareUrl(base: string, code: string): string {
  return `${base}#${code}`
}

export function codeFromHash(hash: string): string | null {
  const value = hash.startsWith('#') ? hash.slice(1) : hash
  return value.length > 0 ? value : null
}
