import { kstDateKey, kstTimeFormat } from '@/reservation/reservationLabels'

/* The rules the backend applies to a start time, mirrored so the form can
 * refuse a time rather than submit it and be told off. tag2now-BE owns them —
 * LEAD_TIME and DAY_END_HOUR in src/reservation/domain.py — and still rejects
 * whatever these let through, so a drift between the two costs a 400, never a
 * bad booking. Change both together. */
const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const LEAD_MS = 10 * MINUTE_MS
const DAY_END = '06:00'
// 05:50: the last round time before dawn, where the default stops.
const LAST_DEFAULT_BEFORE_DAWN_MS = 10 * MINUTE_MS

/** The instant a KST wall-clock time denotes on now's Seoul date. */
const todayAt = (time: string, now: Date) => new Date(`${kstDateKey.format(now)}T${time}:00+09:00`).getTime()

/** The next instant a time of day denotes: today's, unless Seoul has already
 * passed it — at 23:00, 00:30 means half an hour from now. */
export function resolveKstStart(time: string, now: Date): Date {
  const today = todayAt(time, now)
  return new Date(today < now.getTime() ? today + DAY_MS : today)
}

/** The next 06:00 KST. Unlike a start time it rolls over *at* 06:00 rather
 * than after it: at dawn sharp the next session has begun. */
function windowEnd(now: Date): number {
  const dawn = todayAt(DAY_END, now)
  return dawn > now.getTime() ? dawn : dawn + DAY_MS
}

/** Whether the backend would take this time: ten minutes out at least, and before dawn. */
export function isBookable(time: string, now: Date): boolean {
  const start = resolveKstStart(time, now).getTime()
  return start >= now.getTime() + LEAD_MS && start < windowEnd(now)
}

/** Where the form opens: the first whole hour that clears the lead time, held
 * at 05:50 when that hour would be dawn. From 05:50 to 06:00 nothing is
 * bookable at all, and the form says so rather than offering a slot. */
export function defaultStartTime(now: Date): string {
  // Seoul sits a whole number of hours off UTC, so a UTC hour boundary is a KST one.
  const nextHour = Math.ceil((now.getTime() + LEAD_MS) / HOUR_MS) * HOUR_MS
  return kstTimeFormat.format(Math.min(nextHour, windowEnd(now) - LAST_DEFAULT_BEFORE_DAWN_MS))
}
