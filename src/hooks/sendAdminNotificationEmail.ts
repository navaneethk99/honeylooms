import type { CollectionAfterChangeHook } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'
import { formatOrderReference } from '@/utilities/orderReference'
import { getOrCreateOrderInvoice } from '@/utilities/getOrCreateOrderInvoice'

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
    operation === 'update' &&
    previousDoc &&
    previousDoc.status !== 'cancelled' &&
    doc.status === 'cancelled'

  if (!isPlaced && !isCancelled) {
    return
  }

  const adminEmailsEnv = process.env.ADMIN_EMAIL_NOTIFICATIONS
  if (!adminEmailsEnv) {
    payload.logger.warn(`No ADMIN_EMAIL_NOTIFICATIONS found in environment variables`)
    return
  }

  const adminEmails = adminEmailsEnv
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
  if (adminEmails.length === 0) {
    return
  }

  try {
    const { pdfBuffer, toEmail, customerName, paymentMethodLabel } = await getOrCreateOrderInvoice(
      doc,
      req,
    )

    // 8. Construct Dashboard Order URL
    const serverURL = getServerSideURL()
    const dashboardURL = `${serverURL}/admin/collections/orders/${doc.id}`
    const orderCode = formatOrderReference(doc)

    // 9. Compose Email Content
    const actionText = isPlaced ? 'placed' : 'cancelled'
    const emailSubject = `[Honeylooms Admin] Order ${orderCode} has been ${actionText.toUpperCase()}`

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
            This is to notify you that Order <strong>${orderCode}</strong> has been <strong>${actionText}</strong>.
          </p>
          
          <div class="detail-row" style="margin-top: 20px;">
            <span class="detail-label">Order ID:</span>
            <span>${orderCode}</span>
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
          filename: `invoice-${orderCode}.pdf`,
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
