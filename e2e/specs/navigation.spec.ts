import { test, expect } from '@playwright/test'
import { mockAllApis, dismissPatchNotes, goToMatchTab, signInAs, skipPatchNotes } from '../helpers/mock-api'

// Locators here go through roles and accessible names on purpose: the tab strip
// is an ARIA tabs widget, so what a user — or a screen reader — can reach is the
// contract worth asserting. Class names are styling, and a redesign that only
// moves them should not turn this suite red.
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/')
    await dismissPatchNotes(page)
  })

  test('page loads on the overview', async ({ page }) => {
    await expect(page.getByRole('tab', { name: '개요' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('region', { name: '모집 중인 예약' })).toBeVisible()

    // The room-type strip belongs to the match tab and stays out of the way.
    await expect(page.getByRole('tablist', { name: '매칭 종류 선택' })).toHaveCount(0)
  })

  test('the match tab opens on the first room group', async ({ page }) => {
    // Room groups live under the "매칭" tab; rank_match is first in GROUP_ORDER.
    await goToMatchTab(page)

    await expect(page.getByRole('tab', { name: '매칭' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tab', { name: /^랭매/ })).toHaveAttribute('aria-selected', 'true')
  })

  test('all expected tabs are visible', async ({ page }) => {
    const mainTabs = page.getByRole('tablist', { name: 'Main navigation' }).getByRole('tab')
    // 매칭 and 예약 trail a count badge, so match the label, not the whole text.
    await expect(mainTabs).toHaveText([/^개요/, /^매칭/, /^예약/, /^리더보드/, /^커뮤니티/, /^통계/])

    await goToMatchTab(page)
    const roomTabs = page.getByRole('tablist', { name: '매칭 종류 선택' }).getByRole('tab')
    await expect(roomTabs).toHaveCount(2)
    await expect(roomTabs.nth(0)).toHaveAccessibleName(/랭매/)
    await expect(roomTabs.nth(1)).toHaveAccessibleName(/플매/)
  })

  test('tab shows room count in label', async ({ page }) => {
    await goToMatchTab(page)

    // 2 rooms in the rank_match fixture
    await expect(page.getByRole('tab', { name: '랭매 (2)' })).toBeVisible()
  })

  test('clicking leaderboard tab shows leaderboard content', async ({ page }) => {
    await page.getByRole('tab', { name: '리더보드' }).click()

    await expect(page.getByText('Total records: 5')).toBeAttached()
    await expect(page.getByRole('columnheader', { name: 'Player' })).toBeVisible()
  })

  test('clicking community tab shows post list', async ({ page }) => {
    await page.getByRole('tab', { name: '커뮤니티' }).click()

    // Community has filter buttons
    await expect(page.getByRole('button', { name: '전체' })).toBeVisible()
    await expect(page.getByRole('button', { name: '글쓰기' })).toBeVisible()
  })

  test('switching back to room tab shows rooms again', async ({ page }) => {
    await page.getByRole('tab', { name: '리더보드' }).click()
    await expect(page.getByText('Total records: 5')).toBeAttached()

    await page.getByRole('tab', { name: '매칭' }).click()
    await expect(page.getByRole('columnheader', { name: '랭크' })).toBeVisible()
  })

  // The skip link is the whole keyboard-only escape hatch past the header and
  // the sidebar. Three things have to hold: it comes before every other
  // control, activating it lands on main, and it is invisible until focused.
  test('the skip link precedes every other control in the tab order', async ({ page }) => {
    const order = await page.evaluate(() => {
      const sel = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      return Array.from(document.querySelectorAll<HTMLElement>(sel))
        .filter((el) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed')
        .slice(0, 1)
        .map((el) => el.className)
    })
    expect(order[0]).toContain('skip-link')
  })

  test('focusing the skip link reveals it and it jumps to main', async ({ page }) => {
    const skipLink = page.getByRole('link', { name: '본문으로 건너뛰기' })
    await expect(skipLink).not.toBeInViewport()

    await skipLink.focus()
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeInViewport()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#mainContent$/)
    await expect(page.locator('#mainContent')).toBeVisible()
  })

  test('the selected tab moves on click', async ({ page }) => {
    const leaderboardTab = page.getByRole('tab', { name: '리더보드' })
    await expect(leaderboardTab).toHaveAttribute('aria-selected', 'false')

    await leaderboardTab.click()
    await expect(leaderboardTab).toHaveAttribute('aria-selected', 'true')

    // Only one tab is ever selected, so the previous one has to give it up.
    await expect(page.getByRole('tab', { name: '개요' })).toHaveAttribute('aria-selected', 'false')
  })

  test('the header exposes the username and its editor', async ({ page }) => {
    await signInAs(page, 'KingOfIronFist')
    await skipPatchNotes(page)
    await page.reload()

    const headerProfile = page.locator('#headerProfileSlot')
    await expect(headerProfile.getByText('KingOfIronFist')).toBeVisible()
    await headerProfile.getByRole('button', { name: 'KingOfIronFist 헤더에서 유저명 수정' }).click()
    await expect(headerProfile.getByLabel('유저명 입력')).toHaveValue('KingOfIronFist')
    await headerProfile.getByRole('button', { name: '취소' }).click()
  })

  // Below 760px the sidebar card, and its 내 정보 보기, is hidden; the header
  // carries the way into your own record instead.
  test('the mobile header opens your own record', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Desktop reaches the record from the sidebar card.')
    await signInAs(page, 'KingOfIronFist')
    await skipPatchNotes(page)
    await page.reload()

    await page.locator('#headerProfileSlot').getByRole('button', { name: '내 정보' }).click()

    await expect(page.getByRole('button', { name: '플레이어 기록 닫기' })).toBeVisible()
  })

  test('the desktop header leaves 내 정보 to the sidebar card', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Phones have no sidebar card, so the header carries it.')
    await signInAs(page, 'KingOfIronFist')
    await skipPatchNotes(page)
    await page.reload()

    // exact: the name button's label ends in "내 정보 보기" too.
    await expect(page.getByRole('region', { name: '내 파이터 정보' }).getByRole('button', { name: '내 정보 보기', exact: true })).toBeVisible()
    await expect(page.locator('#headerProfileSlot').getByRole('button', { name: '내 정보', exact: true })).toBeHidden()
  })

  test('the populated player card reuses the compact leaderboard character layout', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The detailed profile card belongs to the desktop sidebar.')
    await signInAs(page, 'KingOfIronFist')
    await skipPatchNotes(page)
    await page.reload()

    const card = page.getByRole('region', { name: '내 파이터 정보' })
    const rows = card.locator('.char-cell--compact')
    const cardBox = await card.boundingBox()
    expect(cardBox).not.toBeNull()
    const identityItems = [
      card.locator('.sidebar-profile-rank-position'),
      card.locator('.sidebar-profile-name strong'),
    ]
    const identityBoxes = await Promise.all(identityItems.map(item => item.boundingBox()))
    identityBoxes.forEach(box => expect(box).not.toBeNull())
    expect(await identityItems[1].evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    for (let index = 1; index < identityBoxes.length; index += 1) {
      expect(identityBoxes[index - 1]!.x + identityBoxes[index - 1]!.width).toBeLessThan(identityBoxes[index]!.x)
      const previousCenterY = identityBoxes[index - 1]!.y + identityBoxes[index - 1]!.height / 2
      const currentCenterY = identityBoxes[index]!.y + identityBoxes[index]!.height / 2
      expect(Math.abs(previousCenterY - currentCenterY)).toBeLessThanOrEqual(2)
    }
    const headingItems = [
      card.locator('.sidebar-profile-heading > span'),
      card.locator('.sidebar-profile-presence'),
      card.locator('.sidebar-profile-edit'),
    ]
    await Promise.all(headingItems.map(item => expect(item).toBeVisible()))
    const headingBoxes = await Promise.all(headingItems.map(item => item.boundingBox()))
    headingBoxes.forEach(box => expect(box).not.toBeNull())
    expect(headingBoxes[0]!.x + headingBoxes[0]!.width).toBeLessThan(headingBoxes[1]!.x)
    expect(headingBoxes[1]!.x + headingBoxes[1]!.width).toBeLessThan(headingBoxes[2]!.x)
    await expect(rows).toHaveCount(2)
    await expect(card.locator('.char-cell-record')).toHaveText([/250W 80LWR:76%/, /180W 60LWR:75%/])

    for (let index = 0; index < 2; index += 1) {
      const rank = rows.nth(index).locator('.char-cell-rank')
      const record = rows.nth(index).locator('.char-cell-record')
      const portrait = rows.nth(index).locator('.char-cell-portrait')
      await expect(rank).toBeVisible()
      await expect(record).toBeVisible()
      await expect(portrait).toBeVisible()

      const rankBox = await rank.boundingBox()
      const recordBox = await record.boundingBox()
      const portraitBox = await portrait.boundingBox()
      expect(rankBox).not.toBeNull()
      expect(recordBox).not.toBeNull()
      expect(portraitBox).not.toBeNull()
      expect(rankBox!.x + rankBox!.width).toBeLessThan(portraitBox!.x)
      expect(portraitBox!.x + portraitBox!.width).toBeLessThan(recordBox!.x)
      const leftSpace = rankBox!.x - cardBox!.x
      const rightSpace = cardBox!.x + cardBox!.width - (recordBox!.x + recordBox!.width)
      expect(Math.abs(leftSpace - rightSpace)).toBeLessThanOrEqual(8)
      expect(rankBox!.width).toBeLessThanOrEqual(56)
      expect(rankBox!.height).toBeLessThan(portraitBox!.height)
      expect(portraitBox!.width).toBe(52)
      expect(portraitBox!.height).toBe(52)
    }
  })
})
