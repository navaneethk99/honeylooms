import dotenv from 'dotenv'
dotenv.config()
import { getPayload } from 'payload'
import configPromise from '../payload.config'

async function run() {
  const payload = await getPayload({ config: configPromise })
  const products = await payload.find({
    collection: 'products',
    limit: 10,
  })
  
  console.log('=== PRODUCTS LIST ===')
  for (const product of products.docs) {
    console.log(`Title: ${product.title}`)
    console.log(`priceInUSD: ${product.priceInUSD}`)
    console.log(`onSale: ${product.onSale}`)
    console.log(`salePrice: ${product.salePrice}`)
    console.log(`discountPercentage: ${product.discountPercentage}`)
    console.log(`enableVariants: ${product.enableVariants}`)
    console.log('------------------')
  }
}

run().catch(console.error)
