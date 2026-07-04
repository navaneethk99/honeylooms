import { getPayload } from 'payload'
import configPromise from '../payload.config'

async function check() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'products',
    where: {
      slug: {
        equals: 'rang-rani'
      }
    }
  })

  console.log('PRODUCT DATA:', JSON.stringify(result.docs[0], null, 2))
  process.exit(0)
}

check().catch(console.error)
