import type { CollectionAfterChangeHook } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'
import { generateInvoicePDF } from '@/utilities/generateInvoicePDF'

export const sendAdminNotificationEmail: CollectionAfterChangeHook = async ({
  doc,
  req,
  previousDoc,
  operation,
}) => {
  const payload = req.payload

  // Trigger conditions:
  // 1. Created (Order Placed)
  // 2. Updated to status "cancelled" (Order Cancelled)
  const isPlaced = operation === 'create'
  const isCancelled =
    operation === 'update' && previousDoc && previousDoc.status !== 'cancelled' && doc.status === 'cancelled'

  if (!isPlaced && !isCancelled) {
    return
  }

  const adminEmailsEnv = process.env.ADMIN_EMAIL_NOTIFICATIONS
  if (!adminEmailsEnv) {
    payload.logger.warn(`No ADMIN_EMAIL_NOTIFICATIONS found in environment variables`)
    return
  }

  const adminEmails = adminEmailsEnv.split(',').map((e) => e.trim()).filter(Boolean)
  if (adminEmails.length === 0) {
    return
  }

  try {
    // 1. Get customer name & email
    let toEmail = doc.customerEmail
    let customerName = ''

    if (doc.customer) {
      const customerID = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
      const customer = await payload.findByID({
        collection: 'users',
        id: customerID,
        req,
      })
      if (customer) {
        toEmail = toEmail || customer.email
        customerName = customer.name || ''
      }
    }

    const addr = doc.shippingAddress || {}
    if (addr.firstName || addr.lastName) {
      customerName = [addr.firstName, addr.lastName].filter(Boolean).join(' ')
    }

    // 2. Resolve items, prices, and variants
    const resolvedItems = []
    if (doc.items && Array.isArray(doc.items)) {
      for (const item of doc.items) {
        const productID = typeof item.product === 'object' ? item.product.id : item.product
        const variantID = typeof item.variant === 'object' ? item.variant?.id : item.variant

        let title = 'Product'
        let price = 0
        let variantOptionsText = ''

        if (productID) {
          const product = await payload.findByID({
            collection: 'products',
            id: productID,
            req,
          })
          if (product) {
            title = product.title
            price = product.priceInUSD || 0
          }

          if (variantID && product?.variants?.docs) {
            const variantObj = product.variants.docs.find(
              (v: any) => v.id === variantID || v._id === variantID,
            ) as any
            if (variantObj) {
              price = variantObj.priceInUSD || price
              if (variantObj.options && Array.isArray(variantObj.options)) {
                variantOptionsText = variantObj.options
                  .map((opt: any) => (typeof opt === 'object' ? opt.label : opt))
                  .join(', ')
              }
            }
          }
        }

        resolvedItems.push({
          title,
          variantOptionsText,
          quantity: item.quantity,
          price,
          total: price * item.quantity,
        })
      }
    }

    // 3. Format Date
    const formattedDate = new Date(doc.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // 4. Payment method label
    const paymentMethodLabel =
      doc.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Pay Using UPI'

    // 5. Calculate Subtotal, COD Fee, and Total
    const codFee = doc.paymentMethod === 'cod' ? 2500 : 0
    const subtotal = doc.amount - codFee

    // 6. Get billing address from transaction if possible
    let billingAddress = doc.shippingAddress || {}
    let billingName = customerName

    if (doc.transactions && doc.transactions.length > 0) {
      const firstTx = doc.transactions[0]
      const txID = typeof firstTx === 'object' ? firstTx.id : firstTx
      try {
        const transaction = await payload.findByID({
          collection: 'transactions',
          id: txID,
          req,
        })
        if (transaction && transaction.billingAddress) {
          billingAddress = transaction.billingAddress
          if (billingAddress.firstName || billingAddress.lastName) {
            billingName = [billingAddress.firstName, billingAddress.lastName].filter(Boolean).join(' ')
          }
        }
      } catch (error) {
        payload.logger.error(`Error fetching transaction for billing address in admin notification: ${error}`)
      }
    }

    // 7. Generate Invoice PDF Buffer
    const pdfBuffer = await generateInvoicePDF({
      orderId: doc.id,
      date: formattedDate,
      paymentMethodLabel,
      customerName,
      customerEmail: toEmail || '',
      shippingAddress: {
        addressLine1: addr.addressLine1 || '',
        addressLine2: addr.addressLine2 || '',
        city: addr.city || '',
        state: addr.state || '',
        postalCode: addr.postalCode || '',
        country: addr.country || '',
        phone: addr.phone || '',
      },
      billingName,
      billingAddress: {
        addressLine1: billingAddress.addressLine1 || '',
        addressLine2: billingAddress.addressLine2 || '',
        city: billingAddress.city || '',
        state: billingAddress.state || '',
        postalCode: billingAddress.postalCode || '',
        country: billingAddress.country || '',
        phone: billingAddress.phone || '',
      },
      items: resolvedItems,
      subtotal,
      codFee,
      totalAmount: doc.amount,
    })

    // 8. Construct Dashboard Order URL
    const serverURL = getServerSideURL()
    const dashboardURL = `${serverURL}/admin/collections/orders/${doc.id}`

    // 9. Compose Email Content
    const actionText = isPlaced ? 'placed' : 'cancelled'
    const emailSubject = `[Honeylooms Admin] Order #${doc.id} has been ${actionText.toUpperCase()}`
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${emailSubject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #faf8f5;
            color: #1c1917;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #f5f5f4;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(28,25,23,0.05);
            border-top: 4px solid #141414;
            padding: 40px;
          }
          h1 {
            font-size: 20px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 20px;
            color: #1c1917;
          }
          .detail-row {
            margin-bottom: 12px;
            font-size: 14px;
            line-height: 1.5;
          }
          .detail-label {
            font-weight: 600;
            color: #78716c;
            display: inline-block;
            width: 140px;
          }
          .btn-container {
            margin-top: 30px;
            text-align: center;
          }
          .btn {
            background-color: #141414;
            color: #ffffff !important;
            padding: 12px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 700;
            font-size: 13px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Order Notification</h1>
          <p class="detail-row">
            This is to notify you that Order <strong>#${doc.id}</strong> has been <strong>${actionText}</strong>.
          </p>
          
          <div class="detail-row" style="margin-top: 20px;">
            <span class="detail-label">Order ID:</span>
            <span>#${doc.id}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span style="text-transform: capitalize; font-weight: bold; color: ${isCancelled ? '#b91c1c' : '#15803d'};">${doc.status}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Customer Name:</span>
            <span>${customerName || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Customer Email:</span>
            <span>${toEmail || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Order Total:</span>
            <span>Rs. ${(doc.amount / 100).toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span>${paymentMethodLabel}</span>
          </div>
          
          <div class="btn-container">
            <a href="${dashboardURL}" class="btn">VIEW ORDER IN DASHBOARD</a>
          </div>
        </div>
      </body>
      </html>
    `

    // 10. Send Email
    await payload.sendEmail({
      to: adminEmails,
      subject: emailSubject,
      html: emailHtml,
      attachments: [
        {
          filename: `invoice-${doc.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    payload.logger.info(
      `Admin notification email sent successfully to ${adminEmails.join(', ')} for order #${doc.id} status ${doc.status}`,
    )
  } catch (error) {
    payload.logger.error(`Error sending admin notification email for order #${doc.id}: ${error}`)
  }
}
