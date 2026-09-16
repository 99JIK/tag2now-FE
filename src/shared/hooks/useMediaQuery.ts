import { useSyncExternalStore } from 'react'

/** True while the viewport matches `query`.
 *
 * This exists so a control can be *moved* between two places in the tree rather
 * than rendered twice and hidden once with CSS. The profile control is the case
 * that forced it: it holds the username being edited, so a second hidden copy
 * would be a second copy of that state — type a name into the visible one and
 * the other still shows the old one, and whichever mounts first wins the next
 * reload. A media query in the stylesheet cannot express "render this here
 * instead of there", which is why the breakpoint has to be readable from JS.
 *
 * Keep any query passed here in step with `styles/responsive.css`; the two are
 * describing the same layout and nothing checks that they agree.
 *
 * A browser without `matchMedia` answers `false` — the same "cannot tell, so
 * assume the roomy case" that `useCountUp` makes. jsdom is what actually
 * reaches it, and the desktop arrangement is the one the component tests are
 * written against.
 */
export default function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = matchList(query)
      // A test that stubs `matchMedia` with a bare `{ matches }` object reaches
      // this. Answering the snapshot and never changing is correct for it, and
      // is what keeps the stub from having to grow an event target.
      if (typeof list?.addEventListener !== 'function') return () => {}
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => matchList(query)?.matches ?? false,
  )
}

function matchList(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(query)
}
