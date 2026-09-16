import { MEDAL } from '@/shared/medalColors'
import MiniCharCell from '@/overview/component/MiniCharCell'
import type { CharInfo } from '@/shared/types'

export interface TopFiveRow {
  key: string
  /** Identifies the player to the history panel. Distinct from `key`, which is
   * React's list identity and free to change independently. */
  npid: string
  name: string
  /** The figure the list is ranked by — a win rate, a match count. */
  detail?: string
  /** What that figure is out of, set behind it in the same cell: a rate means
   * little without the matches it was taken over. The leaderboard tab pairs
   * them the same way. */
  detailSub?: string
  /** Absent when the player is not on the leaderboard, which is why the cells
   * render a dash rather than being dropped: the columns stay aligned. */
  mainChar?: CharInfo | null
  subChar?: CharInfo | null
}

interface TopFiveListProps {
  rows: TopFiveRow[]
  /** The heading over `row.detail` — 승률, 판수. It is a real column now: the
   * two cards used to share a row, where a fifth track crushed the name to a
   * character and an ellipsis, so the figure hid under the name instead. They
   * are stacked at full width, and a figure with a heading over it can be
   * compared straight down the list. */
  detailLabel?: string
  emptyMsg?: string
  /** Opens the player history panel, the same way the leaderboard does. */
  onSelect: (npid: string) => void
}

export default function TopFiveList({ rows, detailLabel, emptyMsg = '데이터 없음', onSelect }: TopFiveListProps) {
  if (rows.length === 0) return <p className="state-msg">{emptyMsg}</p>

  return (
    <ol className={`overview-rank-list${detailLabel ? '' : ' has-no-detail'}`} aria-label={`상위 ${rows.length}명`}>
      <li className="overview-rank-head" aria-hidden="true">
        <span>#</span><span>Player</span>{detailLabel && <span>{detailLabel}</span>}<span>Main</span><span>Sub</span>
      </li>
      {rows.map((row, i) => {
        const medal = i < 3 ? MEDAL[i] : null
        return (
          <li
            key={row.key}
            className={medal ? 'overview-rank-row is-podium' : 'overview-rank-row'}
            style={medal ? { '--medal': medal.color } as React.CSSProperties : undefined}
          >
            <span
              className={`rank-no${medal ? ' is-podium' : ''}`}
              style={medal ? { '--medal': medal.color } as React.CSSProperties : undefined}
            >{i + 1}</span>
            <span className="overview-rank-name">
              {/* The button stretches over the whole row in CSS, so a reader
                  aiming at the portrait or the match count opens the same
                  player the name does. The label is a span of its own because
                  the ellipsis needs `overflow: hidden`, and that would clip
                  the very overlay that does the stretching. The title carries
                  the whole name to a pointer once the ellipsis has cut it. */}
              <button type="button" className="player-btn overview-rank-btn" onClick={() => onSelect(row.npid)} title={row.name}>
                <span className="overview-rank-btn-label">{row.name}</span>
              </button>
            </span>
            {/* Its own column, under its own heading, so the figure can be
                compared straight down the list. */}
            {detailLabel && (
              <span className="overview-rank-detail">
                <strong>{row.detail ?? '—'}</strong>
                {row.detailSub && <span>{row.detailSub}</span>}
                <span className="sr-only"> {detailLabel}</span>
              </span>
            )}
            <MiniCharCell char={row.mainChar} label="메인" />
            <MiniCharCell char={row.subChar} label="서브" />
          </li>
        )
      })}
    </ol>
  )
}
