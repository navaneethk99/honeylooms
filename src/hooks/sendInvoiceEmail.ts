import type { CollectionAfterChangeHook } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'
import { generateInvoicePDF } from '@/utilities/generateInvoicePDF'

export const sendInvoiceEmail: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation === 'create') {
    const payload = req.payload

    try {
      // 1. Get recipient email address & customer name
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

      // Override with shipping address name if available
      const addr = doc.shippingAddress || {}
      if (addr.firstName || addr.lastName) {
        customerName = [addr.firstName, addr.lastName].filter(Boolean).join(' ')
      }

      if (!toEmail) {
        payload.logger.warn(`No email found to send invoice for order #${doc.id}`)
        return
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

      const subtotalFormatted = (subtotal / 100).toFixed(2)
      const totalFormatted = (doc.amount / 100).toFixed(2)

      // 6. Build items table HTML
      const itemsHtml = resolvedItems
        .map(
          (item) => `
          <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f4; font-size: 14px;">
              <div style="font-weight: 600; color: #1c1917;">${item.title}</div>
              ${
                item.variantOptionsText
                  ? `<div style="font-size: 12px; color: #78716c; margin-top: 4px;">Variant: ${item.variantOptionsText}</div>`
                  : ''
              }
            </td>
            <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f4; font-size: 14px; text-align: center; color: #78716c;">
              ${item.quantity}
            </td>
            <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f4; font-size: 14px; text-align: right; font-weight: 600; color: #1c1917;">
              ₹${(item.total / 100).toFixed(2)}
            </td>
          </tr>
        `,
        )
        .join('')

      // 7. Construct Order URL
      const serverURL = getServerSideURL()
      const orderURL = `${serverURL}/orders/${doc.id}?email=${encodeURIComponent(toEmail)}&accessToken=${doc.accessToken}`

      // 8. Compose HTML Email with Premium Website Theme (Cream & Gold Aesthetics)
      const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Honeylooms Invoice</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #faf8f5;
            color: #1c1917;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            background-color: #faf8f5;
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
            border-top: 4px solid #D9A321;
          }
          .header {
            background-color: #141414;
            padding: 40px 30px;
            text-align: center;
          }
          .logo-container {
            margin-bottom: 5px;
          }
          .logo-text {
            font-size: 28px;
            font-weight: 700;
            color: #D9A321;
            text-transform: uppercase;
            letter-spacing: 4px;
            margin: 0;
          }
          .logo-sub {
            font-size: 10px;
            color: #a18a5f;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 5px;
          }
          .content {
            padding: 40px 35px;
          }
          h1 {
            font-size: 22px;
            font-weight: 700;
            color: #1c1917;
            margin-top: 0;
            margin-bottom: 12px;
          }
          .intro-text {
            font-size: 15px;
            line-height: 1.6;
            color: #44403c;
            margin-bottom: 30px;
          }
          .order-card {
            background-color: #faf8f5;
            border: 1px solid #f5f5f4;
            border-radius: 8px;
            padding: 20px 24px;
            margin-bottom: 30px;
          }
          .order-card-title {
            font-size: 12px;
            font-weight: 700;
            color: #78716c;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
          }
          .order-meta-item {
            font-size: 14px;
            color: #44403c;
            margin-bottom: 8px;
          }
          .order-meta-item:last-child {
            margin-bottom: 0;
          }
          .order-meta-label {
            font-weight: 600;
            color: #1c1917;
            display: inline-block;
            width: 130px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
          }
          .table th {
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #78716c;
            border-bottom: 1px solid #f5f5f4;
            padding-bottom: 12px;
          }
          .summary-section {
            border-top: 2px solid #1c1917;
            padding-top: 20px;
            margin-top: 20px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
            color: #44403c;
          }
          .summary-row.total {
            font-size: 18px;
            font-weight: 700;
            color: #1c1917;
            border-top: 1px dashed #e7e5e4;
            padding-top: 15px;
            margin-top: 10px;
          }
          .btn-container {
            text-align: center;
            margin: 35px 0 10px 0;
          }
          .btn {
            background-color: #141414;
            color: #ffffff !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 700;
            font-size: 13px;
            letter-spacing: 1px;
            display: inline-block;
            border: 1px solid #D9A321;
          }
          .attachment-notice {
            background-color: #faf8f5;
            border-left: 3px solid #D9A321;
            padding: 12px 16px;
            font-size: 13px;
            color: #44403c;
            margin-top: 30px;
            border-radius: 0 6px 6px 0;
          }
          .footer {
            background-color: #faf8f5;
            padding: 30px;
            text-align: center;
            font-size: 12px;
            color: #78716c;
            border-top: 1px solid #f5f5f4;
            line-height: 1.6;
          }
          .footer a {
            color: #D9A321;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <img src="${serverURL}/logo.svg" alt="Honeylooms" style="max-width: 240px; height: auto; display: block; margin: 0 auto;" />
              </div>
            </div>
            <div class="content">
              <h1>Thank you for your order, ${customerName || 'Customer'}!</h1>
              <p class="intro-text">
                We are thrilled that you chose Honeylooms. We have started processing your order, and we'll send another update as soon as your items are on their way.
              </p>

              <div class="order-card">
                <div class="order-card-title">Order Overview</div>
                <div class="order-meta-item">
                  <span class="order-meta-label">Order ID:</span>
                  <span>#${doc.id}</span>
                </div>
                <div class="order-meta-item">
                  <span class="order-meta-label">Order Date:</span>
                  <span>${formattedDate}</span>
                </div>
                <div class="order-meta-item">
                  <span class="order-meta-label">Payment Method:</span>
                  <span>${paymentMethodLabel}</span>
                </div>
              </div>

              <table class="table">
                <thead>
                  <tr>
                    <th style="text-align: left;">Item</th>
                    <th style="text-align: center; width: 60px;">Qty</th>
                    <th style="text-align: right; width: 100px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div class="summary-section">
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>₹${subtotalFormatted}</span>
                </div>
                ${
                  doc.paymentMethod === 'cod'
                    ? `<div class="summary-row">
                        <span>COD Handling Charge</span>
                        <span>₹25.00</span>
                      </div>`
                    : ''
                }
                <div class="summary-row total">
                  <span>Total Amount</span>
                  <span style="color: #D9A321;">₹${totalFormatted}</span>
                </div>
              </div>

              <div class="attachment-notice">
                <strong>Note:</strong> We have attached a PDF invoice for your records.
              </div>

              <div class="btn-container">
                <a href="${orderURL}" class="btn">VIEW ORDER DETAILS</a>
              </div>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Honeylooms. All rights reserved.<br/>
              If you have any questions or concerns, please contact us at <a href="mailto:contact@honeylooms.com">contact@honeylooms.com</a>.
            </div>
          </div>
        </div>
      </body>
      </html>
      `

      // 9. Generate Invoice PDF Buffer
      const pdfBuffer = await generateInvoicePDF({
        orderId: doc.id,
        date: formattedDate,
        paymentMethodLabel,
        customerName,
        customerEmail: toEmail,
        shippingAddress: {
          addressLine1: addr.addressLine1 || '',
          addressLine2: addr.addressLine2 || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || '',
          country: addr.country || '',
          phone: addr.phone || '',
        },
        items: resolvedItems,
        subtotal,
        codFee,
        totalAmount: doc.amount,
      })

      // 10. Send Email with PDF Attachment
      await payload.sendEmail({
        to: toEmail,
        subject: `Honeylooms Invoice for Order #${doc.id}`,
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
        `Invoice email sent successfully to ${toEmail} for order #${doc.id} with PDF attachment`,
      )
    } catch (error) {
      payload.logger.error(`Error sending invoice email for order #${doc.id}: ${error}`)
    }
  }
}
