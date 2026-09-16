import { describe, expect, it } from 'vitest'
import { kstDayLabel } from '@/reservation/reservationLabels'

/** A Seoul wall-clock instant, written the way the assertions read. */
const kst = (local: string) => new Date(`${local}+09:00`)

describe('kstDayLabel', () => {
  it('calls a later start on the same Seoul date today', () => {
    expect(kstDayLabel(kst('2026-09-14T23:00:00'), kst('2026-09-14T22:00:00'))).toBe('오늘')
  })

  it('calls the small hours tomorrow, though UTC still reads the same date', () => {
    // 00:30 KST on the 15th is 15:30Z on the 14th — as is 23:30 KST on the 14th.
    expect(kstDayLabel(kst('2026-09-15T00:30:00'), kst('2026-09-14T23:30:00'))).toBe('내일')
  })

  it('calls a start still in its grace hour after midnight yesterday', () => {
    expect(kstDayLabel(kst('2026-09-14T23:45:00'), kst('2026-09-15T00:30:00'))).toBe('어제')
  })

  it('falls back to the date for anything further out', () => {
    expect(kstDayLabel(kst('2026-08-25T21:00:00'), kst('2026-09-14T22:00:00'))).toBe('8/25')
  })
})
