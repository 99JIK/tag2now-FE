import { charImageUrl } from '@/shared/characterImage'
import RankImage from './RankImage'
import {CharRankInfo} from "@/shared/types";

export interface CharCellProps {
  name?: string
  rankInfo?: CharRankInfo
  wins?: number
  losses?: number
}

export default function CharCell({ name, rankInfo, wins, losses }: CharCellProps) {
  if (!name) return <div className="char-td" aria-label="캐릭터 없음">—</div>
  const url = charImageUrl(name)
  const total = (wins ?? 0) + (losses ?? 0)
  const winRate = total > 0 ? Math.round((wins ?? 0) / total * 100) : null
  return (
    // Portrait, then rank, then record — left to right in one line at every
    // width. The old cell stacked on mobile and wrapped the rank banner above
    // the portrait, which is what made the row 100px tall there.
    <div className="char-cell">
      {url && <img src={url} alt={name} className="char-art char-cell-portrait" />}
      <div className="char-cell-meta">
        <RankImage rankInfo={rankInfo} className="char-cell-rank" />
        {winRate != null && (
          <span className="char-cell-record">
            <span className="char-cell-wr">{winRate}%</span>
            <span className="char-cell-wl">{wins}<span>W</span> {losses}<span>L</span></span>
          </span>
        )}
      </div>
    </div>
  )
}
