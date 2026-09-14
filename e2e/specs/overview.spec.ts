import { test, expect } from '@playwright/test'
import { mockAllApis, dismissPatchNotes, reservationAt } from '../helpers/mock-api'

// The overview is a summary, so what is worth asserting is that each card
// reflects its own source and that the links out actually change tabs — not the
// layout, which the visual suite covers.
test.describe('Overview', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page, {
      reservations: [
        reservationAt(20, { id: 1, host_display_name: '모집중호스트', capacity: 4, participant_count: 1 }),
        reservationAt(21, { id: 2, host_display_name: '자리없음호스트', capacity: 2, participant_count: 2 }),
      ],
    })
    await page.goto('/')
    await dismissPatchNotes(page)
  })

  test("shows live room figures alongside today's unique players", async ({ page }) => {
    const players = page.getByText('접속자', { exact: true }).locator('..').locator('..')
    await expect(players).toContainText('6')  // rooms fixture: 6 users across both groups

    // 일별 fixture의 unique_players가 172 → 149로 끝나므로 힌트는 전날 값.
    await expect(page.getByText('어제 172명')).toBeVisible()
  })

  test('summarises each feature from its own endpoint', async ({ page }) => {
    await expect(page.getByText('132판')).toBeVisible()
    await expect(page.getByText('모집중호스트')).toBeVisible()
  })

  test('joins weekly players to their leaderboard characters', async ({ page }) => {
    const weekly = page.getByRole('region', { name: '주간 철악귀' })

    // TagComboKing tops the weekly fixture and plays Lars/Alisa on the
    // leaderboard; the portraits have to come from that join, not the weekly
    // endpoint, which knows only match counts.
    const top = weekly.locator('.overview-rank-row').first()
    await expect(top.locator('img[alt="Lars"]')).toBeVisible()
    await expect(top.locator('img[alt="Alisa"]')).toBeVisible()

    // A weekly player absent from the leaderboard keeps its columns as dashes.
    const unranked = weekly.locator('.overview-rank-row', { hasText: 'UnrankedPlayer' })
    await expect(unranked.locator('.mini-char.is-empty')).toHaveCount(2)
  })

  test('keeps weekly player names clear of match counts with compact character art', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The mobile overview places the name and match count on their own row.')
    const top = page.getByRole('region', { name: '주간 철악귀' }).locator('.overview-rank-row').first()
    const nameBox = await top.locator('.overview-rank-name').boundingBox()
    const nameLabel = top.locator('.overview-rank-btn-label')
    const detailBox = await top.locator('.overview-rank-detail').boundingBox()
    const detailTextBox = await top.locator('.overview-rank-detail').evaluate(element => {
      const range = document.createRange()
      range.selectNodeContents(element)
      const rect = range.getBoundingClientRect()
      return { x: rect.x, width: rect.width, lines: range.getClientRects().length }
    })
    const rankBox = await top.locator('.mini-char-rank').first().boundingBox()
    const portraitBox = await top.locator('.mini-char-portrait').first().boundingBox()

    expect(nameBox).not.toBeNull()
    expect(detailBox).not.toBeNull()
    expect(rankBox).not.toBeNull()
    expect(portraitBox).not.toBeNull()
    expect(nameBox!.x + nameBox!.width).toBeLessThanOrEqual(detailBox!.x)
    expect(rankBox!.x - (detailTextBox.x + detailTextBox.width)).toBeGreaterThanOrEqual(10)
    // Three-digit weekly counts are routine (the fixture's top player has 132),
    // and a column too narrow for them broke "132판" across two lines — which
    // the gap check above still passes, since it measures the wrapped box.
    expect(detailTextBox.lines).toBe(1)
    // The markup keeps the whole name; CSS shortens it with an ellipsis only
    // when the column runs out, and the label never spills into the count.
    const labelBox = await nameLabel.boundingBox()
    expect(labelBox).not.toBeNull()
    expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(detailBox!.x)
    await expect(nameLabel).toHaveText('TagComboKing')
    expect(rankBox!.width).toBeLessThanOrEqual(54.72)
    expect(portraitBox!.width).toBeCloseTo(36, 1)
    expect(portraitBox!.height).toBeCloseTo(36, 1)
  })

  test('omits a reservation nobody can still join', async ({ page }) => {
    await expect(page.getByText('모집중호스트')).toBeVisible()
    await expect(page.getByText('자리없음호스트')).toHaveCount(0)
  })

  test('each section links to the tab it summarises', async ({ page }) => {
    const section = page.getByRole('region', { name: '주간 철악귀' })
    // A real link, not a button: middle-click opens it in a tab and the back
    // button undoes the jump, neither of which a click handler would give.
    await section.getByRole('link', { name: '통계' }).click()

    await expect(page).toHaveURL(/\/stats$/)
    // Scoped to the main nav: the stats tab has sub-tabs of its own whose names
    // would otherwise match ("접속자 통계").
    const nav = page.getByRole('tablist', { name: 'Main navigation' })
    await expect(nav.getByRole('tab', { name: '통계' })).toHaveAttribute('aria-selected', 'true')
    await expect(nav.getByRole('tab', { name: '개요' })).toHaveAttribute('aria-selected', 'false')
  })

  // The summary rows are entry points, not just readouts: clicking one opens
  // the item it describes rather than dropping the reader at a list.
  test('a post row opens that post', async ({ page }) => {
    const section = page.getByRole('region', { name: '최신 게시글' })
    // Not .getByRole('link').first() — that is the header's link to the tab.
    await section.getByRole('listitem').first().getByRole('link').click()

    await expect(page).toHaveURL(/\/community\/\d+$/)
    await expect(page.getByRole('button', { name: /목록/ })).toBeVisible()
  })

  test('a reservation row opens that reservation', async ({ page }) => {
    const section = page.getByRole('region', { name: '모집 중인 예약' })
    await section.getByRole('link', { name: /모집중호스트/ }).click()

    await expect(page).toHaveURL(/\/reservation\/1$/)
    const nav = page.getByRole('tablist', { name: 'Main navigation' })
    await expect(nav.getByRole('tab', { name: /^예약/ })).toHaveAttribute('aria-selected', 'true')
  })

  // The rank rows used to offer only the name — 61px of text in a 66px row,
  // with the portraits and the match count beside it describing that same
  // player. A raw coordinate click is the point of this one: whether a pixel
  // out at the row's edge opens anything is a hit test, and the unit suite has
  // no layout engine to answer it.
  test('a top-five row opens the player from anywhere along it', async ({ page }) => {
    const top = page.getByRole('region', { name: '주간 철악귀' }).locator('.overview-rank-row').first()

    // Bottom-left of the row: the position number's column, nowhere near the
    // name, and inside the row in both the desktop and the wrapped layout.
    // Clicked through the row rather than at page coordinates so Playwright
    // scrolls it into view first, and so its hit test still has to pass.
    await top.click({ position: { x: 10, y: 60 } })

    await expect(page.getByRole('button', { name: '플레이어 기록 닫기' })).toBeVisible()
  })

  // The podium rows paint a sheen over their character art, and that layer sits
  // above the name button's row-wide overlay in paint order. Without
  // pointer-events: none it takes this click and the row stops opening.
  test('the podium sheen does not swallow the row click', async ({ page }) => {
    // Parked over the row rather than left to sweep. Unpinned it sits outside
    // the row for three quarters of its cycle, so a click usually misses it and
    // the test would only fail on the rare run that caught the pass --- worse
    // than no guard. This holds it where it does the damage.
    await page.addStyleTag({
      content: '.overview-rank-row.is-medal::after { animation: none !important; transform: none !important; }',
    })
    const medal = page.getByRole('region', { name: '주간 철악귀' }).locator('.overview-rank-row.is-medal').first()
    const box = (await medal.boundingBox())!

    await medal.click({ position: { x: box.width - 20, y: box.height / 2 } })

    await expect(page.getByRole('button', { name: '플레이어 기록 닫기' })).toBeVisible()
  })

  // Deep links are the reason the tabs became routes at all: a shared link has
  // to open on the post itself, cold, with no click path behind it.
  test('a post link opens the post directly', async ({ page }) => {
    await page.goto('/community/1')
    await dismissPatchNotes(page)

    await expect(page.getByRole('button', { name: /목록/ })).toBeVisible()
    const nav = page.getByRole('tablist', { name: 'Main navigation' })
    await expect(nav.getByRole('tab', { name: '커뮤니티' })).toHaveAttribute('aria-selected', 'true')
  })

  test('the back button undoes a row click', async ({ page }) => {
    await page.getByRole('region', { name: '최신 게시글' }).getByRole('listitem').first().getByRole('link').click()
    await expect(page).toHaveURL(/\/community\/\d+$/)

    await page.goBack()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('region', { name: '모집 중인 예약' })).toBeVisible()
  })

  test('a failing source costs only its own card', async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' })
    await mockAllApis(page, { failEndpoints: ['history'] })
    await page.goto('/')
    await dismissPatchNotes(page)

    // The history endpoints are down, but rooms still are not: the KPI row and
    // the reservation card have to survive their neighbour failing.
    await expect(page.getByRole('region', { name: '모집 중인 예약' })).toBeVisible()
    await expect(page.getByRole('region', { name: '주간 철악귀' })).toContainText('주간 기록 없음')
  })
})
