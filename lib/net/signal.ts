/**
 * Offer/answer codes for Layer 1: manual paste.
 *
 * Two browsers behind home routers cannot find each other, and WebRTC leaves
 * the exchange of that first blob unspecified. So the players are the signaling
 * server: one code out, one code back, over any channel they already have.
 * Zero infrastructure, zero third party, and it cannot rot (PRD §7).
 *
 * Codes are deflate-compressed when the platform offers it, because raw SDP is
 * unpleasant to paste. The prefix says which, so an old code stays readable.
 */

export const SIGNAL_VERSION = 1

export type SignalKind = 'offer' | 'answer'

export type SignalPayload = {
  readonly v: number
  readonly kind: SignalKind
  readonly sdp: string
  /** Board parameters travel with the offer. Parameters are not state. */
  readonly rows?: number
  readonly cols?: number
  readonly seed?: number
}

const PLAIN_PREFIX = 'R1.'
const DEFLATE_PREFIX = 'R1z.'

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  const CHUNK = 0x8000
  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function hasCompression(): boolean {
  return typeof globalThis.CompressionStream === 'function'
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = []
  const reader = stream.getReader()
  let total = 0

  for (;;) {
    const step = await reader.read()
    if (step.done) break
    chunks.push(step.value)
    total += step.value.length
  }

  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return collect(stream)
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return collect(stream)
}

export async function encodeSignal(payload: SignalPayload): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  if (!hasCompression()) return PLAIN_PREFIX + toBase64Url(bytes)
  return DEFLATE_PREFIX + toBase64Url(await deflate(bytes))
}

export class SignalFormatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SignalFormatError'
  }
}

/**
 * A well-formed code of the wrong sort — an offer pasted where the reply goes,
 * or the reverse.
 *
 * Its own type because it is the one signalling failure that is neither a
 * broken code nor a network that will not carry the connection. It is a
 * recoverable mistake with an obvious remedy, and the panel has to be able to
 * tell it apart from the two that are not.
 */
export class SignalKindError extends SignalFormatError {
  constructor(
    readonly expected: SignalKind,
    readonly received: SignalKind,
  ) {
    super(`expected a ${expected} code, got an ${received}`)
    this.name = 'SignalKindError'
  }
}

/** Decode, and refuse anything that is not the sort of code we asked for. */
export async function decodeSignalOfKind(code: string, expected: SignalKind): Promise<SignalPayload> {
  const payload = await decodeSignal(code)
  if (payload.kind !== expected) throw new SignalKindError(expected, payload.kind)
  return payload
}

export async function decodeSignal(code: string): Promise<SignalPayload> {
  // People paste with stray spaces and line breaks. That is not an error.
  const cleaned = code.trim().replace(/\s+/g, '')

  let body: string
  let compressed: boolean
  if (cleaned.startsWith(DEFLATE_PREFIX)) {
    body = cleaned.slice(DEFLATE_PREFIX.length)
    compressed = true
  } else if (cleaned.startsWith(PLAIN_PREFIX)) {
    body = cleaned.slice(PLAIN_PREFIX.length)
    compressed = false
  } else {
    throw new SignalFormatError('kode tidak dikenali')
  }

  let bytes: Uint8Array
  try {
    bytes = fromBase64Url(body)
    if (compressed) bytes = await inflate(bytes)
  } catch {
    throw new SignalFormatError('kode rusak atau terpotong')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new SignalFormatError('kode rusak atau terpotong')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as SignalPayload).sdp !== 'string'
  ) {
    throw new SignalFormatError('kode tidak berisi sesi yang sah')
  }

  const payload = parsed as SignalPayload
  if (payload.v !== SIGNAL_VERSION) throw new SignalFormatError('versi kode berbeda')
  if (payload.kind !== 'offer' && payload.kind !== 'answer') {
    throw new SignalFormatError('jenis kode tidak dikenali')
  }

  return payload
}

/** Grouped for reading aloud and for typing back without losing your place. */
export function formatForReading(code: string): string {
  return (code.match(/.{1,48}/g) ?? [code]).join('\n')
}
