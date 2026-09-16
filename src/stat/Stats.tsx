import { useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { panelStatus, statusBody } from "@/shared/util/panelStatus";
import useStats, { type StatsDays} from "@/stat/useStats";
import useWeeklyTop, { type WeeklyTopLimit} from "@/stat/useWeeklyTop";
import PlayerHistoryPanel from "@/shared/components/PlayerHistoryPanel";
import CharCell from "@/shared/components/CharCell";
import { MEDAL } from '@/shared/medalColors'
import type { HourlyActivity, WeeklyTopPlayer } from '@/stat/types'
import DailyChart from '@/shared/components/DailyChart'
import { COLOR_BORDER, COLOR_PRIMARY, COLOR_TXT_DIM, LEGEND_STYLE, SERIES_COLOR, TOOLTIP_STYLE, seriesName, seriesRank } from '@/shared/components/chartTheme'
import ChartLegend from '@/shared/components/ChartLegend'
import type {LeaderboardEntry} from "@/shared/types";
import { Activity, Crown } from 'lucide-react'
import { TableSkeleton } from '@/shared/components/Skeleton'

const DAY_OPTIONS: { value: StatsDays; label: string }[] = [
  { value: 7, label: '7일' },
  { value: 30, label: '30일' },
  { value: 90, label: '90일' },
]

const LIMIT_OPTIONS: { value: WeeklyTopLimit; label: string }[] = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
]

function HourlyChart({ data }: { data: HourlyActivity[] }) {
  if (data.length === 0) return <p className="state-msg">데이터 없음</p>

  return (
    <ResponsiveContainer width="100%" height={176}>
      {/* left: 0, not -20. A negative gutter pulls the plot over its own tick
          labels — the same thing that rendered the daily chart's Y axis as a
          column of clipped glyphs. */}
      <ComposedChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke={COLOR_BORDER} strokeOpacity={0.8} />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          tick={{ fill: COLOR_TXT_DIM, fontSize: 11 }}
          tickFormatter={(h) => String(h)}
          interval={0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: COLOR_TXT_DIM, fontSize: 11 }}
          allowDecimals={false}
          width={30}
        />
        {/* 최대 동시 접속 first: the line is above the bars by definition, so
            that is the order the eye reads them in. See chartTheme. */}
        <Tooltip
          cursor={{ fill: COLOR_PRIMARY, fillOpacity: 0.06 }}
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(h) => `${h}시`}
          formatter={(v, key) => [v, seriesName(String(key))]}
          itemSorter={(item) => seriesRank(String(item.dataKey))}
        />
        <Legend wrapperStyle={LEGEND_STYLE} content={<ChartLegend />} />
        {/* Not the brand red any more: red is 접속자 수 in the chart beside
            this one, and one colour cannot name two different series on the
            same screen. */}
        <Bar dataKey="avg_players" fill={SERIES_COLOR.avg_players} radius={[2, 2, 0, 0]} maxBarSize={20} />
        <Line
          type="monotone"
          dataKey="peak_players"
          stroke={SERIES_COLOR.peak_players}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function ToggleGroup<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label?: string
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-txt-dim font-semibold tracking-wide uppercase">{label}</span>}
      <div className="segmented-control">
        {options.map((opt, i) => (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={`transition-colors cursor-pointer ${
              i > 0 ? 'border-l border-border-light' : ''
            } ${
              value === opt.value
                ? 'bg-primary text-bg-deep'
                : 'text-txt-dim hover:text-txt hover:bg-primary-hover'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function WeeklyTopTable({ data, entries, onSelect }: { data: WeeklyTopPlayer[]; entries: LeaderboardEntry[]; onSelect: (npid: string) => void }) {
  if (data.length === 0) return <p className="state-msg">데이터 없음</p>
  const entryByNpid = new Map(entries.map((e) => [e.np_id, e]))
  return (
    <div className="data-table-wrap">
      <table className="ranking-table weekly-ranking-table">
        <thead>
          <tr>
            <th scope="col" className="tbl-th w-1/20 sm:w-2/20">#</th>
            <th scope="col" className="tbl-th w-7/20 sm:w-4/20">Player</th>
            <th scope="col" className="tbl-th text-right">매치</th>
            <th scope="col" className="tbl-th w-1/20 sm:w-2/20">랭킹</th>
            <th scope="col" className="tbl-th sm:w-7/20 text-center">Main</th>
            <th scope="col" className="tbl-th sm:w-7/20 text-center">Sub</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => {
            const lb = entryByNpid.get(p.npid)
            const medal = i < 3 ? MEDAL[i] : null
            // Keyed off the leaderboard rank, not the row: a top-three player
            // this week need not be top three overall, and the two columns say
            // different things.
            const lbMedal = lb && lb.rank <= 3 ? MEDAL[lb.rank - 1] : null
            return (
              <tr
                key={p.npid}
                className={medal ? 'tbl-row is-podium' : 'tbl-row'}
                style={medal ? { '--medal': medal.color } as React.CSSProperties : undefined}
              >
                <td className="tbl-td rank-cell">
                  <span
                    className={`rank-no${medal ? ' is-podium' : ''}`}
                    style={medal ? { '--medal': medal.color } as React.CSSProperties : undefined}
                  >{i + 1}</span>
                </td>
                <td className="player-name">
                  <button
                    onClick={() => onSelect(p.npid)}
                    className="player-btn"
                    style={medal ? { color: medal.color } : undefined}
                  >
                    {p.online_name}
                  </button>
                </td>
                <td className="tbl-td text-lg font-bold">{p.match_count}</td>
                {/* The player's *leaderboard* rank, which is a different
                    number from the weekly position in the first column. It gets
                    the same .rank-no mark and the same medal table as that
                    column and as the leaderboard itself — it used to be tinted
                    through RANK_COLORS, a second medal palette (#c0c0c0 /
                    #cd7f32) that disagreed with the one every other list uses,
                    so second place was one silver here and another silver two
                    tabs over. */}
                <td className="tbl-td rank-cell w-11">
                  {lb
                    ? <span
                        className={`rank-no${lbMedal ? ' is-podium' : ''}`}
                        style={lbMedal ? { '--medal': lbMedal.color } as React.CSSProperties : undefined}
                      >{lb.rank}</span>
                    : '—'}
                </td>
                <td className="char-td">
                  <CharCell
                    name={lb?.player_info?.main_char_info?.name}
                    rankInfo={lb?.player_info?.main_char_info?.rank_info}
                    wins={lb?.player_info?.main_char_info?.wins}
                    losses={lb?.player_info?.main_char_info?.losses}
                  />
                </td>
                <td className="char-td">
                  <CharCell
                    name={lb?.player_info?.sub_char_info?.name}
                    rankInfo={lb?.player_info?.sub_char_info?.rank_info}
                    wins={lb?.player_info?.sub_char_info?.wins}
                    losses={lb?.player_info?.sub_char_info?.losses}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface StatsProps {
  leaderboardEntries?: LeaderboardEntry[]
}

export default function Stats({ leaderboardEntries = [] }: StatsProps) {
  const { hourly, daily, loading, error, days, setDays } = useStats()
  const wt = useWeeklyTop()
  const [selectedNpid, setSelectedNpid] = useState<string | null>(null)

  const selectedEntry = selectedNpid
    ? leaderboardEntries.find((e) => e.np_id === selectedNpid)
    : undefined

  return (
    <div className="panel">
      {/* One page, not two tabs. The second tab held a single table that the
          home screen already shows in full, and the first held two charts — too
          little to hide behind a control nobody knows to press. Stacked, one
          scroll reaches everything. */}
      {(() => {
        const s = panelStatus(loading, error, {
          loadingMsg: '통계를 불러오는 중',
          skeleton: <TableSkeleton rows={6} columns={4} label="통계를 불러오는 중" />,
        })
        if (s) return s
        return (
          <>
            <div className="section-toolbar compact-toolbar">
              <div className="section-title">
                <span className="section-icon"><Activity size={15} /></span>
                <div><h3>접속자 흐름</h3><p>시간대와 날짜별 활성 사용자</p></div>
              </div>
              <ToggleGroup options={DAY_OPTIONS} value={days} onChange={setDays} label="기간" />
            </div>
            <div className="chart-grid">
              <section aria-labelledby="hourly-heading" className="chart-panel">
                <h4 id="hourly-heading">
                  시간대별 접속자 <span className="text-2xs font-medium opacity-60">(KST)</span>
                </h4>
                <HourlyChart data={hourly} />
              </section>
              <section aria-labelledby="daily-heading" className="chart-panel">
                <h4 id="daily-heading">일별 접속자</h4>
                <DailyChart data={daily} />
              </section>
            </div>
          </>
        )
      })()}

      <div className="section-toolbar compact-toolbar stats-section-break">
        <div className="section-title"><span className="section-icon"><Crown size={15} /></span><div><h3>이번 주 활동왕</h3><p>최근 7일 매치 참여 순위</p></div></div>
        <ToggleGroup options={LIMIT_OPTIONS} value={wt.limit} onChange={wt.setLimit} />
      </div>
      {statusBody(wt.loading, wt.error, {
        loadingMsg: '활동왕을 불러오는 중',
        skeleton: <TableSkeleton rows={5} columns={4} label="활동왕을 불러오는 중" />,
      })}
      {!wt.loading && !wt.error && (
        <WeeklyTopTable data={wt.data} entries={leaderboardEntries} onSelect={setSelectedNpid} />
      )}

      {selectedNpid && (
        <PlayerHistoryPanel
          npid={selectedNpid}
          leaderboardEntry={selectedEntry}
          leaderboardEntries={leaderboardEntries}
          onClose={() => setSelectedNpid(null)}
        />
      )}
    </div>
  )
}
