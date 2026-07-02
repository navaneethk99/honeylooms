import type { CollectionAfterChangeHook } from 'payload'

export const reduceInventory: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation === 'create' && doc.items && Array.isArray(doc.items)) {
    for (const item of doc.items) {
      const productID =
        item.product && typeof item.product === 'object'
          ? item.product.id
          : item.product

      const variantID =
        item.variant && typeof item.variant === 'object'
          ? item.variant.id
          : item.variant

      const quantity = item.quantity || 0

      if (variantID) {
        try {
          const variant = await req.payload.findByID({
            collection: 'variants',
            id: variantID,
            req,
          })
          const currentInventory = variant.inventory || 0
          await req.payload.update({
            collection: 'variants',
            id: variantID,
            data: {
              inventory: Math.max(0, currentInventory - quantity),
            },
            req,
          })
        } catch (error) {
          req.payload.logger.error(
            `Failed to update inventory for variant ${variantID}: ${error}`,
          )
        }
      } else if (productID) {
        try {
          const product = await req.payload.findByID({
            collection: 'products',
            id: productID,
            req,
          })
          const currentInventory = product.inventory || 0
          await req.payload.update({
            collection: 'products',
            id: productID,
            data: {
              inventory: Math.max(0, currentInventory - quantity),
            },
            req,
          })
        } catch (error) {
          req.payload.logger.error(
            `Failed to update inventory for product ${productID}: ${error}`,
          )
        }
      }
    }
  }

  return doc
}
