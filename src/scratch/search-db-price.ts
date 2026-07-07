import dotenv from 'dotenv'
dotenv.config()

async function search() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('../payload.config')).default
  const payload = await getPayload({ config: configPromise })

  console.log('--- SEARCHING PRODUCTS FOR 299 / 29900 ---')
  const products = await payload.find({
    collection: 'products',
    depth: 2,
    limit: 100,
  })

  for (const product of products.docs) {
    if (
      product.priceInUSD === 299 ||
      product.priceInUSD === 29900 ||
      product.salePrice === 299 ||
      product.salePrice === 29900
    ) {
      console.log(`Product MATCH: ${product.title} (ID: ${product.id})`)
      console.log(`- priceInUSD: ${product.priceInUSD}`)
      console.log(`- salePrice: ${product.salePrice}`)
    }

    if (product.variants?.docs) {
      for (const variant of product.variants.docs) {
        if (typeof variant === 'object' && (variant.priceInUSD === 299 || variant.priceInUSD === 29900)) {
          console.log(`Variant MATCH in Product "${product.title}": ${variant.title} (ID: ${variant.id})`)
          console.log(`- priceInUSD: ${variant.priceInUSD}`)
        }
      }
    }
  }

  console.log('--- SEARCHING VARIANTS COLLECTION DIRECTLY ---')
  const variants = await payload.find({
    collection: 'variants',
    depth: 1,
    limit: 100,
  })

  for (const variant of variants.docs) {
    if (variant.priceInUSD === 299 || variant.priceInUSD === 29900) {
      console.log(`Variant MATCH: ${variant.title} (ID: ${variant.id}, Product ID: ${typeof variant.product === 'object' ? variant.product?.id : variant.product})`)
      console.log(`- priceInUSD: ${variant.priceInUSD}`)
    }
  }

  console.log('Done searching.')
  process.exit(0)
}

search()
