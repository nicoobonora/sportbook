/**
 * Test E2E: Pannello admin e super-admin.
 */
import { test, expect } from "@playwright/test"

test.describe("Login admin circolo", () => {
  test("mostra il form di login", async ({ page }) => {
    await page.goto("/admin/login?club=demo")
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeVisible()

    const passwordInput = page.getByLabel(/password/i)
    await expect(passwordInput).toBeVisible()

    const submitButton = page.getByRole("button", { name: /accedi/i })
    await expect(submitButton).toBeVisible()
  })

  test("redirect senza autenticazione", async ({ page }) => {
    await page.goto("/admin/dashboard?club=demo")
    await page.waitForURL("**/admin/login**")
    expect(page.url()).toContain("/admin/login")
  })
})

test.describe("Login super-admin", () => {
  test("mostra il form di login super-admin", async ({ page }) => {
    await page.goto("/login")
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeVisible()
  })

  test("redirect senza autenticazione", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForURL("**/login**")
    expect(page.url()).toContain("/login")
  })
})
