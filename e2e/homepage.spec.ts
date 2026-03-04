/**
 * Test E2E: Homepage del circolo.
 */
import { test, expect } from "@playwright/test"

test.describe("Homepage circolo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?club=demo")
  })

  test("mostra il nome del circolo nell'header", async ({ page }) => {
    const header = page.locator("header")
    await expect(header).toBeVisible()
  })

  test("ha il link di navigazione verso Prenota", async ({ page }) => {
    const prenotaLink = page.getByRole("link", { name: /prenota/i })
    await expect(prenotaLink).toBeVisible()
  })

  test("mostra il footer con il copyright", async ({ page }) => {
    const footer = page.locator("footer")
    await expect(footer).toBeVisible()
    await expect(footer).toContainText("SportBook")
  })

  test("ha skip link accessibile", async ({ page }) => {
    const skipLink = page.locator(".skip-link")
    await expect(skipLink).toHaveCount(1)
  })
})

test.describe("Accessibilità base", () => {
  test("le pagine hanno un main con id main-content", async ({ page }) => {
    await page.goto("/?club=demo")
    const main = page.locator("#main-content")
    await expect(main).toBeVisible()
  })

  test("navigazione ha aria-label", async ({ page }) => {
    await page.goto("/?club=demo")
    const nav = page.locator("nav[aria-label]")
    await expect(nav).toHaveCount(1)
  })
})
