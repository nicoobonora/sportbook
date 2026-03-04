/**
 * Test E2E: Flusso di prenotazione.
 */
import { test, expect } from "@playwright/test"

test.describe("Flusso prenotazione", () => {
  test("mostra lo stepper con 4 step", async ({ page }) => {
    await page.goto("/prenota?club=demo")
    const steps = page.locator("nav[aria-label='Passi della prenotazione'] li")
    await expect(steps).toHaveCount(4)
  })

  test("step 1 mostra la selezione campo", async ({ page }) => {
    await page.goto("/prenota?club=demo")
    const heading = page.getByText("Scegli la struttura")
    await expect(heading).toBeVisible()
  })
})

test.describe("Pagina contatti", () => {
  test("mostra il form di contatto", async ({ page }) => {
    await page.goto("/contatti?club=demo")
    const form = page.locator("form")
    await expect(form).toBeVisible()

    const nameInput = page.getByLabel(/nome/i)
    await expect(nameInput).toBeVisible()

    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeVisible()
  })
})
