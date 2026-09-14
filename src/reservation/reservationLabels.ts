import type { ApiReservation } from '@/reservation/reservationApi'

/** Presentation-only, kept out of reservationApi so it survives that module
 * being mocked wholesale in tests — and so the overview and the reservation tab
 * name a match the same way rather than each holding its own table. */
export const MATCH_TYPE_LABELS: Record<ApiReservation['match_type'], string> = {
  rank_match: '랭크매치',
  player_match: '플레이어 매치',
  any: '상관없음',
}

export const kstTimeFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false })

// en-CA writes a date as YYYY-MM-DD, which Date.parse reads back as UTC
// midnight — so two of them subtract to a whole number of days.
export const kstDateKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })
const kstMonthDay = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' })
const RELATIVE_DAYS: Record<number, string> = { [-1]: '어제', 0: '오늘', 1: '내일' }

/** Which Seoul day a start falls on, relative to now.
 *
 * The listing runs from an hour ago to the next 06:00, so everything it returns
 * is yesterday, today or tomorrow — and a bare time cannot tell tonight's 23:00
 * from the 01:00 after it. Anything further out is not something the server
 * sends, but it is outside data, so it gets a plain M/D rather than a lie.
 */
export function kstDayLabel(startAt: Date, now: Date): string {
  const days = (Date.parse(kstDateKey.format(startAt)) - Date.parse(kstDateKey.format(now))) / 86_400_000
  return RELATIVE_DAYS[days] ?? kstMonthDay.format(startAt)
}

/** Every TTT2 rank, lowest first — the order the game itself promotes through,
 * which is the only thing that makes "highest rank" a meaningful phrase. Here
 * rather than in the tab because the overview ranks the same list. */
export const RANK_ORDER = [
  'Beginner', '9th kyu', '8th kyu', '7th kyu',
  '6th kyu', '5th kyu', '4th kyu', '3rd kyu',
  '2nd kyu', '1st kyu', '1st dan', '2nd dan',
  '3rd dan', 'Disciple', 'Mentor', 'Master',
  'Grand Master', 'Brawler', 'Marauder', 'Fighter',
  'Berserker', 'Warrior', 'Avenger', 'Duelist',
  'Pugilist', 'Vanquisher', 'Destroyer', 'Conqueror',
  'Savior', 'Genbu', 'Byakko', 'Seiryu',
  'Suzaku', 'Fujin', 'Raijin', 'Yaksa',
]

const rankIndex = new Map(RANK_ORDER.map((rank, index) => [rank, index]))

/** Highest first. A rank the list does not know sorts last rather than throwing
 * the order out — the API is free to report one this build has not heard of. */
export const sortRanksDescending = (ranks: string[]) =>
  [...ranks].sort((left, right) => (rankIndex.get(right) ?? -1) - (rankIndex.get(left) ?? -1))
