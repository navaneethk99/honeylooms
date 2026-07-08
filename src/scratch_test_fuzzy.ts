import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from './payload.config'

async function run() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 250,
  })

  console.log(`Product list:`)
  result.docs.forEach((doc) => {
    console.log(`- Title: "${doc.title}"`)
    console.log(`  priceInUSD: ${doc.priceInUSD}`)
    console.log(`  salePrice: ${doc.salePrice}`)
    console.log(`  onSale: ${doc.onSale}`)
    console.log(`  enableVariants: ${doc.enableVariants}`)
    console.log(`  variants:`, JSON.stringify(doc.variants))
    console.log('')
  })

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
