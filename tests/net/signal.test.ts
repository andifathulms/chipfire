import { describe, expect, it } from 'vitest'
import {
  decodeSignal,
  decodeSignalOfKind,
  encodeSignal,
  formatForReading,
  SignalFormatError,
  SignalKindError,
  SIGNAL_VERSION,
} from '@/lib/net/signal'

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

describe('a code of the wrong sort', () => {
  /**
   * The failure the player actually hit: an offer pasted where the reply goes.
   * Both call sites used to read the code's declared kind and then force the
   * type they wanted, so WebRTC was handed an offer labelled as an answer and
   * complained about `a=setup:actpass` — true, and useless to anyone.
   */
  it('is refused, and says which way round it was', async () => {
    const offer = await encodeSignal({ v: SIGNAL_VERSION, kind: 'offer', sdp: 'v=0' })
    const answer = await encodeSignal({ v: SIGNAL_VERSION, kind: 'answer', sdp: 'v=0' })

    await expect(decodeSignalOfKind(offer, 'answer')).rejects.toBeInstanceOf(SignalKindError)
    await expect(decodeSignalOfKind(answer, 'offer')).rejects.toBeInstanceOf(SignalKindError)

    await expect(decodeSignalOfKind(offer, 'answer')).rejects.toMatchObject({
      expected: 'answer',
      received: 'offer',
    })
  })

  it('lets the right sort through unchanged', async () => {
    const offer = await encodeSignal({ v: SIGNAL_VERSION, kind: 'offer', sdp: 'v=0', rows: 6 })
    await expect(decodeSignalOfKind(offer, 'offer')).resolves.toMatchObject({
      kind: 'offer',
      rows: 6,
    })
  })

  /** A wrong code and a broken code are different problems with different
   *  remedies, but both are the code rather than the network — which is what
   *  the panel keys off. */
  it('is still a format error, so nothing mistakes it for a dead connection', async () => {
    const offer = await encodeSignal({ v: SIGNAL_VERSION, kind: 'offer', sdp: 'v=0' })
    await expect(decodeSignalOfKind(offer, 'answer')).rejects.toBeInstanceOf(SignalFormatError)
    await expect(decodeSignalOfKind('nonsense', 'offer')).rejects.toBeInstanceOf(SignalFormatError)
  })
})
