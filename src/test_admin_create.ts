import 'dotenv/config'
import { getPayload } from 'payload'
import config from './payload.config'
import { chromium } from '@playwright/test'

async function run() {
  console.log('Initializing Payload...')
  const payload = await getPayload({ config })
  
  const email = 'test-admin-temp-99@honeylooms.com'
  const password = 'TemporaryAdminPassword123!'

  console.log('Checking for temporary admin user...')
  let adminUser = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: email,
      },
    },
  })

  if (adminUser.docs.length === 0) {
    console.log('Creating temporary admin user...')
    await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        roles: ['admin'],
        name: 'yas',
      },
    })
  }

  console.log('Launching browser...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text())
  })

  page.on('pageerror', err => {
    console.error('[BROWSER PAGE ERROR]:', err.message, err.stack)
  })

  console.log('Navigating to login page...')
  await page.goto('http://localhost:3000/admin/login')

  console.log('Filling credentials...')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  
  console.log('Submitting login...')
  await page.click('button[type="submit"]')

  console.log('Waiting for navigation to dashboard...')
  await page.waitForURL('**/admin**')
  await page.waitForTimeout(2000)

  console.log('Navigating to products list page...')
  await page.goto('http://localhost:3000/admin/collections/products')

  console.log('Waiting for products list page load...')
  await page.waitForTimeout(4000)

  console.log('Clicking "Create New" button...')
  await page.click('text="Create New"')

  console.log('Waiting after click...')
  await page.waitForTimeout(4000)

  const currentUrl = page.url()
  console.log('Current URL after click:', currentUrl)

  const titleText = await page.title()
  console.log('Page Title after click:', titleText)

  const formExists = await page.evaluate(() => document.querySelector('form') !== null)
  console.log('Form tag exists after click:', formExists)

  const visibleText = await page.evaluate(() => document.body.innerText)
  console.log('Visible page text snippet after click:', visibleText.substring(0, 1000))

  console.log('Closing browser...')
  await browser.close()

  console.log('Deleting temporary admin user...')
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: email,
      },
    },
  })

  console.log('Done!')
  process.exit(0)
}

run().catch(err => {
  console.error('Crash in test runner:', err)
  process.exit(1)
})
