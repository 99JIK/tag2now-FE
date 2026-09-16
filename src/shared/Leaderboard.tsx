import { useMemo, useState } from 'react'
import { MEDAL } from '@/shared/medalColors'
import LoadingBar from "@/shared/components/LoadingBar";
import CharCell from "@/shared/components/CharCell";
import PlayerHistoryPanel from "@/shared/components/PlayerHistoryPanel";
import LeaderboardControls from "@/shared/components/LeaderboardControls";
import {panelStatus} from "@/shared/util/panelStatus";
import {filterEntries, tiersPresent, totals, COLLAPSED_VISIBLE, type SortKey} from "@/shared/util/leaderboardFilter";
import { getUsername } from '@/shared/util/cookie'
import {LeaderboardData} from "@/shared/types";
import { RefreshCw, Trophy } from 'lucide-react'
import { TableSkeleton } from '@/shared/components/Skeleton'

interface LeaderboardProps {
  data: LeaderboardData | null
  loading: boolean
  refreshing?: boolean
  error: string | null
  onRefresh?: () => void
}

export default function Leaderboard({ data, loading, refreshing, error, onRefresh }: LeaderboardProps) {
  const [selectedNpid, setSelectedNpid] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [character, setCharacter] = useState('')
  const [tier, setTier] = useState('')
  const [sort, setSort] = useState<SortKey>('rank')
  // Collapsed by default. Expanded, 344 rows made the page ~27,000px tall — a
  // scrollbar thumb a few pixels high, and nobody reads to 344th place from the
  // top. The control to see everything is right there in the toolbar, and any
  // search or character filter shows its full result regardless.
  const [collapsed, setCollapsed] = useState(true)

  const entries = data?.entries ?? []
  const visible = useMemo(
    () => filterEntries(entries, { search, character, tier, sort, collapsed }),
    [entries, search, character, tier, sort, collapsed],
  )
  const tiers = useMemo(() => tiersPresent(entries), [entries])
  // Finding yourself on a 344-row board meant scrolling or typing your own name
  // from memory. The row is marked instead, so it is visible the moment it is.
  const me = getUsername()

  const s = panelStatus(loading, error, {
    loadingMsg: '랭킹을 불러오는 중',
    onRetry: onRefresh,
    skeleton: <TableSkeleton rows={10} columns={5} label="랭킹을 불러오는 중" />,
  })
  if (s) return s
  if (!data) return null

  return (
    <div className="panel relative" aria-live="polite">
      <LoadingBar visible={refreshing} />
      <div className="section-toolbar">
        <div className="section-title">
          <span className="section-icon"><Trophy size={15} aria-hidden="true" /></span>
          <div><h3>전체 랭킹</h3><p>등록 플레이어 {data.total_records}명</p><span className="sr-only">Total records: {data.total_records}</span></div>
        </div>
        {onRefresh && (
          <button className="refresh-btn" aria-label="새로고침" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      <LeaderboardControls
        search={search}
        onSearchChange={setSearch}
        character={character}
        onCharacterChange={setCharacter}
        tier={tier}
        onTierChange={setTier}
        tiers={tiers}
        sort={sort}
        onSortChange={setSort}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        collapsible={entries.length > COLLAPSED_VISIBLE}
        filtering={search.trim() !== '' || character !== '' || tier !== ''}
        shown={visible.length}
        total={entries.length}
      />
      <div className="data-table-wrap">
        <table className="ranking-table leaderboard-table">
          <caption className="sr-only">Leaderboard rankings</caption>
          <thead>
            <tr>
              <th scope="col" className="tbl-th w-1/20 sm:w-2/20">#</th>
              <th scope="col" className="tbl-th w-7/20 sm:w-4/20">Player</th>
              <th scope="col" className="tbl-th lb-total-col">전적</th>
              <th scope="col" className="tbl-th sm:w-7/20 text-center">Main</th>
              <th scope="col" className="tbl-th sm:w-7/20 text-center">Sub</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e,i) => {
              // Keyed off the true rank, not the row index: a filtered view must
              // not award a medal to whoever happens to land in the top rows.
              const medal = e.rank <= 3 ? MEDAL[e.rank - 1] : null
              const rowStyle = medal ? { '--medal': medal.color } as React.CSSProperties : undefined
              const total = totals(e)
              const isMe = me != null && e.online_name === me
              const cellStyle = medal ? { color: medal.color } : undefined
              return (
                <tr key={e.np_id} className={`tbl-row${medal ? ' is-podium' : ''}${isMe ? ' is-me' : ''}`} style={rowStyle}>
                  <td className="tbl-td rank-cell">
                    {/* The rank, plainly. Colour is what marks the podium — it
                        is the one treatment that also fits the overview's
                        summary rows, so the two finally read the same. */}
                    <span
                      className={`rank-no${medal ? ' is-podium' : ''}`}
                      style={medal ? { '--medal': medal.color } as React.CSSProperties : undefined}
                    >{e.rank}</span>
                  </td>
                  <td className="player-name" style={cellStyle}>
                    <button onClick={() => setSelectedNpid(e.np_id)} className="player-btn" style={cellStyle}>
                      {e.online_name}
                    </button>
                    {isMe && <span className="lb-you">나</span>}
                  </td>
                  <td className="tbl-td lb-total-col">
                    {total.winRate === null
                      ? <span className="lb-total-empty">기록 없음</span>
                      : <span className="lb-total">
                          <strong>{Math.round(total.winRate * 100)}%</strong>
                          <span>{total.matches}판</span>
                        </span>}
                  </td>
                  <td className="char-td">
                    <CharCell name={e.player_info?.main_char_info?.name} rankInfo={e.player_info?.main_char_info?.rank_info} wins={e.player_info?.main_char_info?.wins} losses={e.player_info?.main_char_info?.losses} />
                  </td>
                  <td className="char-td">
                    <CharCell name={e.player_info?.sub_char_info?.name} rankInfo={e.player_info?.sub_char_info?.rank_info} wins={e.player_info?.sub_char_info?.wins} losses={e.player_info?.sub_char_info?.losses} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 && entries.length > 0 && (
          <p className="state-msg">검색 결과가 없습니다</p>
        )}
      </div>
      {selectedNpid && (
        <PlayerHistoryPanel npid={selectedNpid} leaderboardEntry={data?.entries.find(e => e.np_id === selectedNpid)} leaderboardEntries={data?.entries} onClose={() => setSelectedNpid(null)} />
      )}
    </div>
  )
}
