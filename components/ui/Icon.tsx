/**
 * The app's icons: stroked at 2px on a 24px grid, drawn in currentColor so
 * they take whatever ink their button has. Inline rather than a dependency —
 * this is the whole set.
 *
 * Always decorative. The button an icon sits in carries the label.
 */
export type IconName =
  | 'undo'
  | 'restart'
  | 'board'
  | 'eye'
  | 'eye-off'
  | 'sound'
  | 'sound-off'
  | 'play'
  | 'pause'
  | 'back'
  | 'forward'
  | 'close'
  | 'trace'
  | 'speed'
  | 'copy'
  | 'sun'
  | 'moon'
  | 'system'

function paths(name: IconName) {
  switch (name) {
    case 'undo':
      return (
        <>
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
        </>
      )
    case 'restart':
      return (
        <>
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </>
      )
    case 'board':
      return (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
      )
    case 'eye':
      return (
        <>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )
    case 'eye-off':
      return (
        <>
          <path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.4 3.3M6.2 6.2C3.6 8 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.8-1.8" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          <path d="m3 3 18 18" />
        </>
      )
    case 'sound':
      return (
        <>
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
        </>
      )
    case 'sound-off':
      return (
        <>
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          <path d="m22 9-6 6M16 9l6 6" />
        </>
      )
    case 'play':
      return <path d="M7 4.5v15l12-7.5-12-7.5z" fill="currentColor" stroke="none" />
    case 'pause':
      return (
        <>
          <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
          <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
        </>
      )
    case 'back':
      return <path d="M15 18 9 12l6-6" />
    case 'forward':
      return <path d="m9 18 6-6-6-6" />
    case 'close':
      return <path d="M18 6 6 18M6 6l12 12" />
    case 'trace':
      return <path d="M3 12h4l3-8 4 16 3-8h4" />
    case 'speed':
      return (
        <>
          <path d="M12 14l4-4" />
          <path d="M3.3 17a9 9 0 1 1 17.4 0" />
        </>
      )
    case 'copy':
      return (
        <>
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
        </>
      )
    case 'sun':
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      )
    case 'moon':
      return <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    case 'system':
      return (
        <>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </>
      )
    default: {
      const exhaustive: never = name
      throw new Error(`unhandled icon: ${String(exhaustive)}`)
    }
  }
}

export function Icon({ name, className = 'h-[18px] w-[18px]' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {paths(name)}
    </svg>
  )
}
