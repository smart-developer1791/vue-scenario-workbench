import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
test('branch traversal preserves per-step notes and exports a completed path', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try the journey' }).click()
  await page.getByLabel('A note to yourself').fill('Remember this starting point')
  await page.getByRole('button', { name: 'A brand new idea' }).click()
  await page.getByLabel('A note to yourself').fill('A new idea note')
  await page.getByRole('button', { name: 'Back one step' }).click()
  await expect(page.getByLabel('A note to yourself')).toHaveValue('Remember this starting point')
  await page.getByRole('button', { name: 'A brand new idea' }).click()
  await expect(page.getByLabel('A note to yourself')).toHaveValue('A new idea note')
  await page.getByRole('button', { name: 'The digital experience' }).click()
  await expect(page.locator('[data-ui~="runner-card"] h2')).toHaveText('Make one useful page.')
  await page.getByRole('button', { name: 'Export scenario' }).click()
  const event = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download completed run' }).click()
  const data = JSON.parse(await fs.readFile((await (await event).path())!, 'utf8'))
  expect(data.completed).toBe(true)
  expect(data.trail.map((item: { id: string }) => item.id)).toEqual(['start', 'new', 'website'])
  expect(data.notes.start).toBe('Remember this starting point')
})
test('editing the map persists and disconnected additions become connected paths', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByLabel('Step heading').fill('A different starting question')
  await page.reload()
  await expect(page.getByLabel('Step heading')).toHaveValue('A different starting question')
  await page.getByRole('button', { name: 'Add step', exact: true }).click()
  await expect(page.locator('[data-ui~="steps-panel"]')).toContainText('1 disconnected')
  await page.getByLabel('Step heading').fill('Our new outcome')
  await page
    .locator('[data-ui~="step-list"]')
    .getByRole('button', { name: 'A different starting question' })
    .click()
  await page.getByRole('button', { name: 'Add a path' }).click()
  await page
    .locator('[data-ui~="choice-editor"]')
    .last()
    .getByLabel('Leads to')
    .selectOption({ label: 'Our new outcome' })
  await expect(page.locator('[data-ui~="steps-panel"]')).not.toContainText('disconnected')
  await page.getByRole('button', { name: 'Try the journey' }).click()
  await page.getByRole('button', { name: 'Another way forward' }).click()
  await expect(page.locator('[data-ui~="runner-card"] h2')).toHaveText('Our new outcome')
})
test('cyclic imports preserve the existing scenario', async ({ page }) => {
  await page.goto('/')
  const data = await (await page.request.get('/sample-workspace.json')).json()
  data.steps[1].choices[0].to = 'start'
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByLabel('Scenario JSON').fill(JSON.stringify(data))
  await page.getByRole('button', { name: 'Import scenario' }).click()
  await expect(page.getByRole('alert')).toContainText('cycle')
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await expect(page.locator('[data-ui~="graph-node"]')).toHaveCount(6)
})
test('mobile map scrolls internally and the runner keeps a fixed height', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(
    await page
      .locator('[data-ui~="scenario-map"]')
      .evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(true)
  const before = await page.locator('[data-ui~="preview-panel"]').boundingBox()
  await page.getByRole('button', { name: 'Try the journey' }).click()
  expect((await page.locator('[data-ui~="preview-panel"]').boundingBox())!.height).toBe(
    before!.height,
  )
  await page.getByRole('button', { name: 'Something already exists' }).click()
  await page.getByRole('button', { name: 'A smoother experience' }).click()
  await expect(page.locator('[data-ui~="runner-card"] h2')).toHaveText('Listen, then simplify.')
})
