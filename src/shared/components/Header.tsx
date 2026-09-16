import type { ReactNode } from 'react'

interface HeaderProps {
  /** The profile control, but only on the narrow layout — the sidebar is a
   * fixed bottom bar there and has nowhere to put it. `App` decides; see
   * `useMediaQuery` for why it is moved rather than rendered twice. */
  children?: ReactNode
}

/** The wordmark, and on a phone the profile.
 *
 * It used to carry the Live count and the profile as well, which made a
 * 68px bar hold three unrelated things and put the two live figures on this
 * page — Live and the overview's 접속자 card — within a few hundred pixels of
 * each other saying the same number. Both moved above the nav, where the rest
 * of "what is true right now" already lives: the tab you are on, the room
 * count, the reservation count.
 */
export default function Header({ children }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        {/* The mark the site is already identified by: this is the same file
            the browser tab and the share card use, so the three cannot drift.
            It replaces a hand-drawn "2" in a bordered box that looked like a
            placeholder for the logo rather than the logo. */}
        <img className="brand-mark" src="/favicon.svg" alt="" aria-hidden="true" width={34} height={34} />
        {/* What the site *is* belongs at the end, with the credits — a header
            has to carry identity and navigation, and a subtitle read once is
            neither. The version moved with it for the same reason. */}
        <h1 aria-label="Tag 2 Now">TAG<span>2</span>NOW</h1>
      </div>
      {children}
    </header>
  )
}
