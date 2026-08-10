import { encodeSignal, decodeSignalOfKind, type SignalPayload } from './signal'
import { encodeMessage, decodeMessage, type NetMessage } from './sync'

/**
 * WebRTC data channel, transport only.
 *
 * A public STUN server is a trivial dependency and is needed for address
 * discovery. TURN is out: it is a paid relay, so roughly 10–20% of connections
 * — symmetric NAT, strict corporate networks — simply cannot work. That is
 * detected and stated plainly, not hidden behind a spinner (PRD §7).
 */
export const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

/** ICE gathering can trickle for a long time; the useful candidates arrive early. */
export const GATHER_TIMEOUT_MS = 4000

export type LinkStatus =
  | 'idle'
  | 'generating'
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'failed'
  | 'closed'

export type LinkHandlers = {
  onStatus: (status: LinkStatus) => void
  onMessage: (message: NetMessage) => void
}

export type PeerLink = {
  readonly connection: RTCPeerConnection
  channel: RTCDataChannel | null
  send: (message: NetMessage) => boolean
  close: () => void
}

function attach(link: PeerLink, channel: RTCDataChannel, handlers: LinkHandlers): void {
  link.channel = channel
  channel.addEventListener('open', () => handlers.onStatus('connected'))
  channel.addEventListener('close', () => handlers.onStatus('closed'))
  channel.addEventListener('message', (event: MessageEvent<string>) => {
    const message = decodeMessage(event.data)
    if (message !== null) handlers.onMessage(message)
  })
}

export function createLink(handlers: LinkHandlers): PeerLink {
  const connection = new RTCPeerConnection({ iceServers: STUN_SERVERS })

  const link: PeerLink = {
    connection,
    channel: null,
    send(message) {
      if (link.channel === null || link.channel.readyState !== 'open') return false
      link.channel.send(encodeMessage(message))
      return true
    },
    close() {
      link.channel?.close()
      connection.close()
      handlers.onStatus('closed')
    },
  }

  connection.addEventListener('connectionstatechange', () => {
    // Fail fast and say so, rather than spinning forever on a path that will
    // never open.
    if (connection.connectionState === 'failed') handlers.onStatus('failed')
    if (connection.connectionState === 'disconnected') handlers.onStatus('closed')
  })

  connection.addEventListener('datachannel', (event) => attach(link, event.channel, handlers))

  return link
}

/** Resolve once gathering finishes, or once the timeout says it is good enough. */
function gathered(connection: RTCPeerConnection): Promise<void> {
  if (connection.iceGatheringState === 'complete') return Promise.resolve()

  return new Promise((resolve) => {
    const done = () => {
      connection.removeEventListener('icegatheringstatechange', check)
      window.clearTimeout(timer)
      resolve()
    }
    const check = () => {
      if (connection.iceGatheringState === 'complete') done()
    }
    const timer = window.setTimeout(done, GATHER_TIMEOUT_MS)
    connection.addEventListener('icegatheringstatechange', check)
  })
}

export type OfferSetup = {
  readonly rows: number
  readonly cols: number
  readonly seed: number
}

/** Host side: open the channel, produce the offer code to send to the guest. */
export async function createOffer(
  link: PeerLink,
  handlers: LinkHandlers,
  setup: OfferSetup,
): Promise<string> {
  handlers.onStatus('generating')

  const channel = link.connection.createDataChannel('chipfire', { ordered: true })
  attach(link, channel, handlers)

  const offer = await link.connection.createOffer()
  await link.connection.setLocalDescription(offer)
  await gathered(link.connection)

  handlers.onStatus('waiting')

  return encodeSignal({
    v: 1,
    kind: 'offer',
    sdp: link.connection.localDescription?.sdp ?? offer.sdp ?? '',
    rows: setup.rows,
    cols: setup.cols,
    seed: setup.seed,
  })
}

/** Guest side: take the offer code, produce the answer code to send back. */
export async function acceptOffer(
  link: PeerLink,
  handlers: LinkHandlers,
  code: string,
): Promise<{ answer: string; setup: SignalPayload }> {
  handlers.onStatus('generating')

  /*
   * The code says which sort it is, and until now both call sites read that
   * and then ignored it, forcing the type they happened to want. Paste an
   * offer where the reply belongs and WebRTC was handed an offer labelled as
   * an answer; it looks at `a=setup:actpass`, which only an offer carries, and
   * fails with "Answerer must use either active or passive value for setup
   * attribute" — a true statement about SDP that tells the player nothing.
   */
  const payload = await decodeSignalOfKind(code, 'offer')
  await link.connection.setRemoteDescription({ type: payload.kind, sdp: payload.sdp })

  const answer = await link.connection.createAnswer()
  await link.connection.setLocalDescription(answer)
  await gathered(link.connection)

  handlers.onStatus('connecting')

  const encoded = await encodeSignal({
    v: 1,
    kind: 'answer',
    sdp: link.connection.localDescription?.sdp ?? answer.sdp ?? '',
  })

  return { answer: encoded, setup: payload }
}

/** Host side: take the answer code back and the channel opens. */
export async function acceptAnswer(
  link: PeerLink,
  handlers: LinkHandlers,
  code: string,
): Promise<void> {
  const payload = await decodeSignalOfKind(code, 'answer')
  await link.connection.setRemoteDescription({ type: payload.kind, sdp: payload.sdp })
  handlers.onStatus('connecting')
}
