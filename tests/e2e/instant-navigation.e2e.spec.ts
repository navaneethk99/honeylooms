import { instant } from '@next/playwright'
import { expect, type Locator, type Page, test } from '@playwright/test'

const baseURL = 'http://localhost:3000'

async function navigate(page: Page, path: string) {
  await page.goto(`${baseURL}${path}`, { timeout: 60_000, waitUntil: 'domcontentloaded' })
}

async function expectInstantShell(page: Page, link: Locator, testID: string) {
  const href = await link.getAttribute('href')
  const prefetch = href
    ? page
        .waitForResponse(
          (response) => {
            const headers = response.request().headers()
            return (
              new URL(response.url()).pathname === href &&
              (headers['next-router-prefetch'] === '1' ||
                Boolean(headers['next-router-segment-prefetch']))
            )
          },
          { timeout: 10_000 },
        )
        .catch(() => null)
    : Promise.resolve(null)

  await link.scrollIntoViewIfNeeded()
  await link.hover()
  await Promise.race([prefetch, page.waitForTimeout(5_000)])

  await instant(page, async () => {
    await link.click()
    await expect(page.locator(`[data-testid="${testID}"]:visible`).first()).toBeVisible()
  })
}

test.describe('Instant storefront navigation', () => {
  test.describe.configure({ timeout: 90_000 })

  test('homepage to collection renders a shell immediately', async ({ page }) => {
    await navigate(page, '')

    const collectionLink = page.locator('a[href^="/collections/"]').first()
    test.skip((await collectionLink.count()) === 0, 'Requires a homepage collection link')

    await expectInstantShell(page, collectionLink, 'collection-page-shell')
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('collection to product renders a shell immediately', async ({ page }) => {
    await navigate(page, '/collections')

    const collectionHrefs = await page
      .locator('a[href^="/collections/"]')
      .evaluateAll((links) => [
        ...new Set(links.map((link) => link.getAttribute('href')).filter(Boolean)),
      ])

    let productLink: Locator | null = null

    for (const href of collectionHrefs) {
      await navigate(page, href!)
      const candidate = page.locator('a[href^="/products/"]').first()

      if (
        await candidate.waitFor({ state: 'visible', timeout: 5_000 }).then(
          () => true,
          () => false,
        )
      ) {
        productLink = candidate
        break
      }
    }

    test.skip(!productLink, 'Requires a collection containing a product')

    await expectInstantShell(page, productLink!, 'product-page-shell')
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible()
  })

  test('product to related product renders a shell immediately', async ({ page }) => {
    const response = await page.request.get(`${baseURL}/api/products`, {
      params: {
        depth: '1',
        limit: '100',
        'where[_status][equals]': 'published',
      },
    })
    const result = (await response.json()) as {
      docs: Array<{
        relatedProducts?: Array<string | { slug?: string }>
        slug?: string
      }>
    }
    const product = result.docs.find(
      (doc) =>
        doc.slug &&
        doc.relatedProducts?.some(
          (related) => typeof related === 'object' && Boolean(related.slug),
        ),
    )

    test.skip(!product?.slug, 'Requires a published product with a related product')
    await navigate(page, `/products/${product!.slug}`)

    const relatedProductLink = page
      .getByRole('heading', { name: 'Related Products' })
      .locator('..')
      .locator('a[href^="/products/"]')
      .first()

    await expect(relatedProductLink).toBeVisible()

    await expectInstantShell(page, relatedProductLink, 'product-page-shell')
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible()
  })
})
