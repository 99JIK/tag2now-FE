import { MEDAL } from '@/shared/medalColors'
import MiniCharCell from '@/overview/component/MiniCharCell'
import type { CharInfo } from '@/shared/types'

export interface TopFiveRow {
  key: string
  /** Identifies the player to the history panel. Distinct from `key`, which is
   * React's list identity and free to change independently. */
  npid: string
  name: string
  /** Right-hand figure — a match count, whatever the list ranks by. Omit it
   * when the position column already says the same thing. */
  detail?: string
  /** Absent when the player is not on the leaderboard, which is why the cells
   * render a dash rather than being dropped: the columns stay aligned. */
  mainChar?: CharInfo | null
  subChar?: CharInfo | null
}

interface TopFiveListProps {
  rows: TopFiveRow[]
  /** Names what `row.detail` counts, e.g. "매치". It is read to the figure
   * rather than shown as a column header: these cards are half the width of
   * the leaderboard, and a fifth column crushed the player name to a single
   * character. The figure now sits under the name instead. */
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
        <span>#</span><span>Player</span><span>Main</span><span>Sub</span>
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
                  the very overlay that does the stretching. */}
              <button type="button" className="player-btn overview-rank-btn" onClick={() => onSelect(row.npid)}>
                <span className="overview-rank-btn-label">{row.name}</span>
              </button>
              {row.detail && (
                <span className="overview-rank-detail">
                  {row.detail}
                  {detailLabel && <span className="sr-only"> {detailLabel}</span>}
                </span>
              )}
            </span>
            <MiniCharCell char={row.mainChar} label="메인" />
            <MiniCharCell char={row.subChar} label="서브" />
          </li>
        )
      })}
    </ol>
  )
}
