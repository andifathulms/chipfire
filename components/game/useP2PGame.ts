'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  acceptAnswer,
  acceptOffer,
  createLink,
  createOffer,
  diagnose,
  type FailureCause,
  type IceReport,
  type LinkStatus,
  type PeerLink,
} from '@/lib/net/channel'
import { verify, type NetMessage } from '@/lib/net/sync'
import { SignalFormatError } from '@/lib/net/signal'
import { findDivergence } from '@/lib/engine/diverge'
import { hashState } from '@/lib/engine/hash'
import { DEFAULT_CONFIG, type GameState } from '@/lib/engine/state'
import { useGameSession } from './useGameSession'

/**
 * Two browsers, no authority, no referee. Each holds its own state and applies
 * the same moves through the same pure function, so a hash accompanies every
 * move. On mismatch both sides halt and say so — never auto-reconcile by
 * trusting one of them (PRD §7).
 */
export type Role = 'host' | 'guest'

export type Desync = {
  readonly turn: number
  readonly expected: string
  readonly received: string
}

type Incoming = { readonly index: number; readonly turn: number; readonly hash: string }

export function useP2PGame() {
  const session = useGameSession(DEFAULT_CONFIG)
  const sessionRef = useRef(session)
  sessionRef.current = session

  const [role, setRole] = useState<Role | null>(null)
  const [status, setStatus] = useState<LinkStatus>('idle')
  const [offerCode, setOfferCode] = useState('')
  const [answerCode, setAnswerCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  /*
   * A bad paste is not a failed connection. It has its own slot so the panel
   * can say what actually went wrong, and so the link — which is still open and
   * still waiting for the right code — is not thrown away over a typo.
   */
  const [codeError, setCodeError] = useState<string | null>(null)
  /** What the local side can actually tell about a failure, rather than a
   *  guess. Null until something has genuinely failed. */
  const [cause, setCause] = useState<FailureCause | null>(null)
  const [ice, setIce] = useState<IceReport | null>(null)
  const [desync, setDesync] = useState<Desync | null>(null)
  const [offeredMoves, setOfferedMoves] = useState<readonly number[] | null>(null)

  /*
   * The cascade preview, agreed rather than assumed (PRD §9.2). Two flags,
   * because "both players agree" cannot be represented by one: mine is a
   * choice, theirs is news. Both start off, and a session that never discusses
   * it never gets a preview — which is the correct default for the one mode
   * where the tool is also an advantage.
   */
  const [previewMine, setPreviewMine] = useState(false)
  const [previewTheirs, setPreviewTheirs] = useState(false)

  const linkRef = useRef<PeerLink | null>(null)
  const inbox = useRef<Incoming[]>([])
  const [pendingCount, setPendingCount] = useState(0)

  const handlers = useRef({
    onStatus: (next: LinkStatus) => {
      /*
       * Read the candidate tally at the moment of failure, while the link that
       * failed is still the current one. Asking later races a retry.
       */
      if (next === 'failed') {
        const link = linkRef.current
        setCause(link === null ? null : diagnose(link))
        setIce(link === null ? null : { ...link.ice })
      }
      setStatus(next)
    },
    onMessage: (message: NetMessage) => {
      switch (message.t) {
        case 'hello':
          // Board parameters, not a board. The guest rebuilds by replay.
          sessionRef.current.reset({
            rows: message.rows,
            cols: message.cols,
            players: 2,
            seed: message.seed,
          })
          if (message.moves.length > 0) sessionRef.current.load(message.moves)
          break
        case 'move':
          inbox.current.push({ index: message.index, turn: message.turn, hash: message.hash })
          setPendingCount((count) => count + 1)
          break
        case 'desync':
          setDesync({ turn: message.turn, expected: '—', received: message.hash })
          break
        case 'resync':
          // Offered, not applied. Accepting is an explicit act by the player.
          setOfferedMoves(message.moves)
          break
        case 'preview':
          setPreviewTheirs(message.on)
          break
        case 'bye':
          setStatus('closed')
          break
        default: {
          const exhaustive: never = message
          throw new Error(`unhandled message: ${JSON.stringify(exhaustive)}`)
        }
      }
    },
  })

  const me = role === 'guest' ? 1 : 0
  const connected = status === 'connected'
  // Agreement, not preference: one yes is a request, two is a preview.
  const previewAgreed = previewMine && previewTheirs
  const animating = session.pending !== null

  // Remote moves wait for the local cascade to finish playing, so the animation
  // is never cut short and the two peers stay on the same turn.
  useEffect(() => {
    if (!connected || desync !== null || animating) return
    const next = inbox.current[0]
    if (next === undefined) return

    const applied = sessionRef.current.play(next.index)
    if (applied === null) {
      setDesync({ turn: next.turn, expected: 'langkah tidak sah', received: next.hash })
      return
    }

    const verdict = verify(applied.turn, hashState(applied), next.turn, next.hash)
    inbox.current.shift()
    setPendingCount((count) => Math.max(0, count - 1))

    if (!verdict.ok) {
      setDesync({ turn: next.turn, expected: hashState(applied), received: next.hash })
      linkRef.current?.send({ t: 'desync', turn: applied.turn, hash: hashState(applied) })
    }
  }, [connected, desync, animating, pendingCount])

  /*
   * A fresh connection for every attempt.
   *
   * This used to hand back whatever was in the ref, so once a connection had
   * failed — for any reason, including pasting the wrong code once — every
   * subsequent try reused the same dead RTCPeerConnection and failed again no
   * matter what was pasted into it. A peer connection cannot be reopened after
   * it fails; the only way to try again is to build another one.
   */
  const freshLink = useCallback(() => {
    const previous = linkRef.current
    if (previous !== null) {
      previous.connection.close()
      linkRef.current = null
    }
    const link = createLink({
      onStatus: (next) => handlers.current.onStatus(next),
      onMessage: (message) => handlers.current.onMessage(message),
    })
    linkRef.current = link
    return link
  }, [])

  const host = useCallback(async () => {
    setError(null)
    setCodeError(null)
    setCause(null)
    setRole('host')
    const link = freshLink()
    try {
      const code = await createOffer(
        link,
        { onStatus: setStatus, onMessage: (message) => handlers.current.onMessage(message) },
        {
          rows: sessionRef.current.config.rows,
          cols: sessionRef.current.config.cols,
          seed: sessionRef.current.config.seed,
        },
      )
      setOfferCode(code)
    } catch (thrown) {
      setStatus('failed')
      setError(thrown instanceof Error ? thrown.message : String(thrown))
    }
  }, [freshLink])

  const join = useCallback(
    async (code: string) => {
      setError(null)
      setCodeError(null)
      setCause(null)
      setRole('guest')
      const link = freshLink()
      try {
        const result = await acceptOffer(
          link,
          { onStatus: setStatus, onMessage: (message) => handlers.current.onMessage(message) },
          code,
        )
        setAnswerCode(result.answer)
        sessionRef.current.reset({
          rows: result.setup.rows ?? DEFAULT_CONFIG.rows,
          cols: result.setup.cols ?? DEFAULT_CONFIG.cols,
          players: 2,
          seed: result.setup.seed ?? DEFAULT_CONFIG.seed,
        })
      } catch (cause) {
        if (cause instanceof SignalFormatError) {
          setCodeError(cause.name === 'SignalKindError' ? 'kind' : 'format')
          setStatus('idle')
          return
        }
        setStatus('failed')
        setError(cause instanceof Error ? cause.message : String(cause))
      }
    },
    [freshLink],
  )

  const confirm = useCallback(async (code: string) => {
    setError(null)
    setCodeError(null)
    const link = linkRef.current
    if (link === null) return
    try {
      await acceptAnswer(
        link,
        { onStatus: setStatus, onMessage: (message) => handlers.current.onMessage(message) },
        code,
      )
    } catch (cause) {
      /*
       * A code problem leaves the connection exactly as it was: the offer is
       * still valid and the peer can still answer it, so the status goes back
       * to waiting rather than to failed. Only a genuine transport failure
       * ends the attempt.
       */
      if (cause instanceof SignalFormatError) {
        setCodeError(cause.name === 'SignalKindError' ? 'kind' : 'format')
        setStatus('waiting')
        return
      }
      setStatus('failed')
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [])

  // The host announces the parameters once the channel is actually open.
  useEffect(() => {
    if (!connected || role !== 'host') return
    linkRef.current?.send({
      t: 'hello',
      rows: session.config.rows,
      cols: session.config.cols,
      seed: session.config.seed,
      moves: session.record.moves,
    })
    // Once per opened channel, not once per move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, role])

  /*
   * Both sides state where they stand as soon as the channel opens, so neither
   * has to ask and someone who set the toggle before connecting is not silently
   * ignored. Sent by guest and host alike — the preference is symmetric, unlike
   * the board parameters.
   */
  useEffect(() => {
    if (!connected) return
    linkRef.current?.send({ t: 'preview', on: previewMine })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected])

  const play = useCallback(
    (index: number) => {
      if (desync !== null) return
      const applied: GameState | null = sessionRef.current.play(index)
      if (applied === null) return
      linkRef.current?.send({
        t: 'move',
        turn: applied.turn,
        index,
        hash: hashState(applied),
      })
    },
    [desync],
  )

  const setPreview = useCallback((on: boolean) => {
    setPreviewMine(on)
    linkRef.current?.send({ t: 'preview', on })
  }, [])

  /** Offer our move list to the peer. They choose whether to take it. */
  const offerResync = useCallback(() => {
    linkRef.current?.send({ t: 'resync', moves: sessionRef.current.record.moves })
  }, [])

  const acceptResync = useCallback(() => {
    if (offeredMoves === null) return
    sessionRef.current.load(offeredMoves)
    inbox.current = []
    setOfferedMoves(null)
    setDesync(null)
  }, [offeredMoves])

  /*
   * Where the two games stopped agreeing.
   *
   * Only computable once the peer has offered their move list, which is exactly
   * when it is needed: the resync panel currently asks a player to adopt
   * somebody else's history without telling them how it differs from their own.
   *
   * No protocol change — `resync` already carries moves, and the desync report
   * already carries the hash the peer computed. Both were on the wire and only
   * the accept/decline was being asked of them.
   */
  const divergence = useMemo(() => {
    if (offeredMoves === null) return null
    return findDivergence(
      session.config,
      session.record.moves,
      offeredMoves,
      desync === null ? null : { turn: desync.turn, hash: desync.received },
    )
  }, [offeredMoves, session.config, session.record.moves, desync])

  const disconnect = useCallback(() => {
    linkRef.current?.send({ t: 'bye' })
    linkRef.current?.close()
    linkRef.current = null
    setStatus('closed')
  }, [])

  useEffect(() => () => linkRef.current?.close(), [])

  return {
    session,
    role,
    me,
    status,
    connected,
    offerCode,
    answerCode,
    error,
    codeError,
    cause,
    ice,
    desync,
    offeredMoves,
    divergence,
    previewMine,
    previewTheirs,
    previewAgreed,
    setPreview,
    host,
    join,
    confirm,
    play,
    offerResync,
    acceptResync,
    disconnect,
    setRole,
  }
}
