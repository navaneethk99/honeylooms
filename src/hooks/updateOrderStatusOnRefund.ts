import type { CollectionAfterChangeHook } from 'payload'

export const updateOrderStatusOnRefund: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const payload = req.payload

  // Check if status changed during an update operation
  const isStatusChanged =
    operation === 'update' && previousDoc && previousDoc.status !== doc.status

  if (!isStatusChanged) {
    return
  }

  const newRefundStatus = doc.status
  const orderId = typeof doc.order === 'object' ? doc.order?.id : doc.order

  if (!orderId) {
    return
  }

  let nextOrderStatus: string | null = null

  if (newRefundStatus === 'approved') {
    nextOrderStatus = 'refund_approved'
  } else if (newRefundStatus === 'rejected') {
    nextOrderStatus = 'refund_rejected'
  }

  if (nextOrderStatus) {
    try {
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: {
          status: nextOrderStatus as any,
        },
        overrideAccess: true,
      })
      payload.logger.info(
        `Updated order #${orderId} status to '${nextOrderStatus}' due to refund request status change to '${newRefundStatus}'`
      )
    } catch (error) {
      payload.logger.error(
        `Error updating order #${orderId} status to '${nextOrderStatus}' on refund status change: ${error}`
      )
    }
  }
}
