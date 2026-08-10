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

/**
 * What address discovery actually turned up, counted as candidates arrive.
 *
 * `srflx` is the one that matters: a server-reflexive candidate is your public
 * address as STUN reported it. Zero of them means STUN never answered, which is
 * a different problem from "no route between the two of you" and has a
 * different remedy. Without this the panel had no evidence for anything and
 * blamed the network for every failure regardless.
 */
export type IceReport = {
  host: number
  srflx: number
  relay: number
  /** False when gathering was still running when the timeout cut it short. */
  complete: boolean
}

export type PeerLink = {
  readonly connection: RTCPeerConnection
  channel: RTCDataChannel | null
  readonly ice: IceReport
  send: (message: NetMessage) => boolean
  close: () => void
}

/**
 * Why a connection failed, as far as the local side can actually tell.
 *
 * `no-stun` is diagnosable and often fixable. `no-route` is the case PRD §7
 * accepts and declines to solve: both sides know their public address and no
 * path between them opened, which is what a TURN relay exists for and there
 * isn't one. Only the second deserves the "some networks simply do not allow
 * it" message that was previously shown for everything.
 */
export type FailureCause = 'no-stun' | 'no-route'

export function diagnose(link: PeerLink): FailureCause {
  return link.ice.srflx === 0 ? 'no-stun' : 'no-route'
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
  const ice: IceReport = { host: 0, srflx: 0, relay: 0, complete: false }

  const link: PeerLink = {
    connection,
    channel: null,
    ice,
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

  /*
   * Counted rather than inspected after the fact: the candidate list is not
   * retrievable from the connection once gathering ends, so if we do not tally
   * them as they arrive we have nothing to say when it fails.
   */
  connection.addEventListener('icecandidate', (event) => {
    const candidate = event.candidate
    if (candidate === null) {
      ice.complete = true
      return
    }
    if (candidate.type === 'host') ice.host += 1
    else if (candidate.type === 'srflx') ice.srflx += 1
    else if (candidate.type === 'relay') ice.relay += 1
  })

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
