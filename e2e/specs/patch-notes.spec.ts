import { test, expect } from '@playwright/test'
import { dismissPatchNotes, mockAllApis } from '../helpers/mock-api'

/**
 * Every other spec suppresses this dialog before it paints, so this file is the
 * only place the dialog itself is exercised. It deliberately does NOT call
 * `skipPatchNotes` — that would remove the thing under test.
 */
test.describe('Patch notes', () => {
  const dialog = (page: import('@playwright/test').Page) =>
    page.locator('[aria-labelledby="patch-notes-title"]')

  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
  })

  test('opens on a first visit and closes on the X', async ({ page }) => {
    await page.goto('/')

    await expect(dialog(page)).toBeVisible()
    await dismissPatchNotes(page)
    await expect(dialog(page)).toHaveCount(0)
  })

  /** The X closes this showing only. Nothing is written, so the next load
   * brings it back — which is why suppressing it needs the storage key rather
   * than a click. */
  test('the X does not settle it, so a reload shows it again', async ({ page }) => {
    await page.goto('/')
    await dismissPatchNotes(page)

    await page.reload()

    await expect(dialog(page)).toBeVisible()
  })

  /** "다시 보지 않기" is the affordance that writes the seen marker, and it is
   * what `skipPatchNotes` short-circuits by seeding the same key. */
  test('다시 보지 않기 settles it across reloads', async ({ page }) => {
    await page.goto('/')
    await dialog(page).getByRole('button', { name: '다시 보지 않기' }).click()
    await expect(dialog(page)).toHaveCount(0)

    await page.reload()

    await expect(dialog(page)).toHaveCount(0)
  })
})
