import RankImage from '@/shared/components/RankImage'
import { charImageUrl } from '@/shared/characterImage'
import type { CharInfo } from '@/shared/types'

/** The overview's row-sized counterpart to CharCell.
 *
 * CharCell is built for a table cell — a 60px portrait, a rank badge and a
 * win/loss column. A summary row has no space for that, so this keeps the two
 * things that identify a player at a glance (portrait and rank) and drops the
 * stats, which the leaderboard tab is one click away for.
 */
export default function MiniCharCell({ char, label }: { char?: CharInfo | null; label: string }) {
  if (!char?.name) return <span className="mini-char is-empty" aria-label={`${label} 없음`}>—</span>

  const url = charImageUrl(char.name)
  const rank = char.rank_info?.name
  const title = rank ? `${label}: ${char.name} (${rank})` : `${label}: ${char.name}`
  // The figure the leaderboard leads with, so the summary of it says the same
  // thing. It used to show a portrait and a rank and no numbers at all, which
  // made the two lists look like different data about the same players.
  const played = (char.wins ?? 0) + (char.losses ?? 0)
  const winRate = played > 0 ? Math.round((char.wins ?? 0) / played * 100) : null

  return (
    <span className="mini-char" title={title}>
      {/* Portrait then rank, the order CharCell uses on the leaderboard. */}
      {url
        ? <img src={url} alt={char.name} className="char-art mini-char-portrait" loading="lazy" />
        : <span className="mini-char-name">{char.name}</span>}
      <span className="mini-char-meta">
        <RankImage rankInfo={char.rank_info} className="mini-char-rank" />
        {winRate != null && (
          <span className="mini-char-record">
            <span className="mini-char-wr">{winRate}%</span>
            <span className="mini-char-wl">{char.wins}<span>W</span> {char.losses}<span>L</span></span>
          </span>
        )}
      </span>
    </span>
  )
}
