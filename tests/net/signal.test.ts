import { describe, expect, it } from 'vitest'
import { decodeSignal, encodeSignal, formatForReading, SignalFormatError } from '@/lib/net/signal'

const SDP = [
  'v=0',
  'o=- 4611731400430051336 2 IN IP4 127.0.0.1',
  's=-',
  't=0 0',
  'a=group:BUNDLE 0',
  'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
  'a=candidate:842163049 1 udp 1677729535 203.0.113.10 55555 typ srflx',
  'a=fingerprint:sha-256 8C:71:B3:8D:A6:CF:2B:00:11:22:33:44:55:66:77:88',
].join('\r\n')

describe('signal codes', () => {
  it('round-trips an offer with the board parameters', async () => {
    const code = await encodeSignal({ v: 1, kind: 'offer', sdp: SDP, rows: 6, cols: 9, seed: 42 })
    const decoded = await decodeSignal(code)

    expect(decoded.kind).toBe('offer')
    expect(decoded.sdp).toBe(SDP)
    expect(decoded.rows).toBe(6)
    expect(decoded.cols).toBe(9)
    expect(decoded.seed).toBe(42)
  })

  it('survives the whitespace people introduce by pasting', async () => {
    const code = await encodeSignal({ v: 1, kind: 'answer', sdp: SDP })
    const mangled = `  ${formatForReading(code)}\n`

    expect((await decodeSignal(mangled)).sdp).toBe(SDP)
  })

  it('compresses rather than merely encoding', async () => {
    // Real SDP runs to a couple of kilobytes of highly repetitive candidate
    // lines, which is where deflate earns its place: the code is what a player
    // has to paste into WhatsApp.
    const candidates = Array.from(
      { length: 24 },
      (_, n) => `a=candidate:${n} 1 udp 1677729535 203.0.113.${n} 5555${n} typ srflx`,
    ).join('\r\n')
    const payload = { v: 1, kind: 'offer', sdp: `${SDP}\r\n${candidates}` } as const

    const code = await encodeSignal(payload)
    const uncompressed = Buffer.from(JSON.stringify(payload)).toString('base64url')

    expect(code.startsWith('R1z.')).toBe(true)
    expect(code.length).toBeLessThan(uncompressed.length / 2)
  })

  it('rejects a code that is not one of ours', async () => {
    await expect(decodeSignal('halo apa kabar')).rejects.toBeInstanceOf(SignalFormatError)
  })

  it('rejects a truncated code instead of half-accepting it', async () => {
    const code = await encodeSignal({ v: 1, kind: 'offer', sdp: SDP })
    await expect(decodeSignal(code.slice(0, code.length - 12))).rejects.toBeInstanceOf(
      SignalFormatError,
    )
  })

  it('rejects a future version rather than guessing at it', async () => {
    const code = await encodeSignal({ v: 2, kind: 'offer', sdp: SDP })
    await expect(decodeSignal(code)).rejects.toThrow(/versi/)
  })
})
