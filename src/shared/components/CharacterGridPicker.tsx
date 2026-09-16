import { CHARACTER_GRID, charImageUrl } from '@/shared/characterImage'

interface CharacterGridPickerProps {
  /** Currently chosen characters. Single-select callers pass zero or one. */
  selected: string[]
  /** Called with the tile pressed; the caller decides add, remove or replace. */
  onToggle: (name: string) => void
  /** How many may be held at once. At the cap, unselected tiles go inert
   * rather than silently dropping someone's earlier pick. */
  max?: number
}

const COLUMNS = Math.max(...CHARACTER_GRID.map((row) => row.length))

/** The character filter.
 *
 * The markup is always the game's select-screen arrangement — 23 columns,
 * three rows, and the blank cells the game itself leaves (including the centre
 * column it fills with a random-select `?`, which has no meaning in a filter
 * and is rendered as a plain spacer).
 *
 * The *layout* is the container's call, not the viewport's, because what
 * decides whether 23 columns are readable is how much room this grid actually
 * has — the panel it sits in is not the window. Given ~700px it keeps the game
 * arrangement, where a face is where a player already expects it. Below that a
 * column would be under 30px, so the spacers drop out and the roster wraps into
 * whatever fits, with names shown since the positions no longer carry any.
 *
 * Either way the tiles hold the art's real 204:329 ratio and nothing scrolls
 * sideways.
 */
export default function CharacterGridPicker({ selected, onToggle, max = 1 }: CharacterGridPickerProps) {
  const full = selected.length >= max
  return (
    <div
      className="char-grid"
      role="group"
      aria-label="캐릭터로 거르기"
      style={{ '--char-grid-columns': COLUMNS } as React.CSSProperties}
    >
      {CHARACTER_GRID.flatMap((row, rowIndex) =>
        Array.from({ length: COLUMNS }, (_, column) => {
          const name = row[column]
          const url = name ? charImageUrl(name) : null
          if (!name || !url) return <span key={`gap-${rowIndex}-${column}`} className="char-grid-gap" aria-hidden="true" />
          const active = selected.includes(name)
          // At the cap the remaining tiles go dead rather than replacing an
          // earlier pick, which is the same rule the reservation rank picker
          // follows — a silent swap loses a choice the user made on purpose.
          const capped = full && !active
          return (
            <button
              key={name}
              type="button"
              onClick={() => onToggle(name)}
              disabled={capped}
              aria-pressed={active}
              aria-label={name}
              className={`char-grid-tile${active ? ' is-active' : ''}${capped ? ' is-capped' : ''}`}
              title={name}
            >
              <img src={url} alt="" />
              <span className="char-grid-name">{name}</span>
            </button>
          )
        }),
      )}
    </div>
  )
}
