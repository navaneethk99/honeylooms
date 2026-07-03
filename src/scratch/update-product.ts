import dotenv from 'dotenv'
dotenv.config()
import { getPayload } from 'payload'
import configPromise from '../payload.config'

async function run() {
  const payload = await getPayload({ config: configPromise })
  
  // Find the product by title
  const result = await payload.find({
    collection: 'products',
    where: {
      title: {
        equals: 'test product',
      },
    },
  })
  
  const product = result.docs[0]
  if (!product) {
    console.error('Product not found!')
    return
  }
  
  console.log(`Updating product: ${product.title} (ID: ${product.id})`)
  
  // Save/Update the product to trigger beforeChange hook
  const updated = await payload.update({
    collection: 'products',
    id: product.id,
    data: {
      onSale: true,
      salePrice: 100,
    },
  })
  
  console.log('Update result:')
  console.log(`onSale: ${updated.onSale}`)
  console.log(`salePrice: ${updated.salePrice}`)
  console.log(`discountPercentage: ${updated.discountPercentage}`)
}

run().catch(console.error)
