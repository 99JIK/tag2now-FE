import { describe, expect, it } from 'vitest'
import { defaultStartTime, isBookable, resolveKstStart } from '@/reservation/bookingWindow'

/** A Seoul wall-clock instant, written the way the assertions read. */
const kst = (local: string) => new Date(`${local}+09:00`)

describe('resolveKstStart', () => {
  const evening = kst('2026-08-28T20:10:00')

  it('keeps a time still ahead today on today', () => {
    expect(resolveKstStart('21:00', evening)).toEqual(kst('2026-08-28T21:00:00'))
  })

  it('rolls a time Seoul has already passed over to tomorrow', () => {
    expect(resolveKstStart('01:30', evening)).toEqual(kst('2026-08-29T01:30:00'))
  })
})

describe('isBookable', () => {
  it.each([
    ['20:20', true],   // exactly the ten-minute lead
    ['20:19', false],  // inside the lead
    ['05:59', true],   // the small hours after tonight
    ['06:00', false],  // dawn closes the window
    ['20:00', false],  // already passed, so tomorrow evening: past dawn
  ])('at 20:10 KST, %s is %s', (time, expected) => {
    expect(isBookable(time, kst('2026-08-28T20:10:00'))).toBe(expected)
  })

  it.each([
    ['05:59', true],
    ['06:00', false],
    ['21:00', false],  // tonight belongs to the session that starts at 06:00
  ])('at 02:00 KST, %s is %s', (time, expected) => {
    expect(isBookable(time, kst('2026-08-29T02:00:00'))).toBe(expected)
  })

  it('has nothing to offer in the last ten minutes before dawn', () => {
    expect(isBookable('05:59', kst('2026-08-29T05:52:00'))).toBe(false)
  })
})

describe('defaultStartTime', () => {
  it.each([
    ['2026-08-28T13:01:00', '14:00'],
    ['2026-08-28T13:50:00', '14:00'],  // 14:00 is exactly ten minutes out
    ['2026-08-28T13:55:00', '15:00'],  // 14:00 is inside the lead
    ['2026-08-28T23:30:00', '00:00'],  // past midnight, into tomorrow
    ['2026-08-29T05:20:00', '05:50'],  // 06:00 would be dawn
  ])('at %s KST opens on a bookable %s', (local, expected) => {
    const now = kst(local)

    expect(defaultStartTime(now)).toBe(expected)
    expect(isBookable(expected, now)).toBe(true)
  })
})
