import type { CollectionAfterChangeHook } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'

export const sendRefundNotificationEmail: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  const payload = req.payload

  // Only trigger on creation
  if (operation !== 'create') {
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
    const serverURL = getServerSideURL()
    const dashboardURL = `${serverURL}/admin/collections/refunds/${doc.id}`

    const reasonLabels: Record<string, string> = {
      size_issue: 'Size Issue',
      manufacturing_defect: 'Manufacturing Defect',
    }

    const resolutionLabels: Record<string, string> = {
      original_payment: 'Refund to original payment method',
      store_credit: 'Store credit / Replacement',
    }

    const reasonLabel = reasonLabels[doc.reason] || doc.reason
    const resolutionLabel = resolutionLabels[doc.resolution] || doc.resolution

    const emailSubject = `[Honeylooms Admin] New Return/Refund Request for Order #${doc.order}`

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
            border-top: 4px solid #b91c1c;
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
            width: 150px;
            vertical-align: top;
          }
          .detail-value {
            display: inline-block;
            width: calc(100% - 160px);
          }
          .btn-container {
            margin-top: 30px;
            text-align: center;
          }
          .btn {
            background-color: #b91c1c;
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
          <h1>Return/Refund Request</h1>
          <p class="detail-row">
            A customer has submitted a new return/refund request for Order <strong>#${doc.order}</strong>.
          </p>
          
          <div class="detail-row" style="margin-top: 20px;">
            <span class="detail-label">Order ID:</span>
            <span class="detail-value">#${doc.order}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Reason:</span>
            <span class="detail-value" style="font-weight: bold;">${reasonLabel}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Resolution Preference:</span>
            <span class="detail-value">${resolutionLabel}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Contact Email:</span>
            <span class="detail-value">${doc.contactEmail}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Contact Phone:</span>
            <span class="detail-value">${doc.contactPhone}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Explanation:</span>
            <span class="detail-value" style="white-space: pre-wrap;">${doc.explanation}</span>
          </div>
          
          <div class="btn-container">
            <a href="${dashboardURL}" class="btn">VIEW REQUEST IN DASHBOARD</a>
          </div>
        </div>
      </body>
      </html>
    `

    await payload.sendEmail({
      to: adminEmails,
      subject: emailSubject,
      html: emailHtml,
    })

    payload.logger.info(
      `Admin refund request notification email sent successfully to ${adminEmails.join(', ')} for order #${doc.order}`
    )
  } catch (error) {
    payload.logger.error(`Error sending admin refund request notification email: ${error}`)
  }
}
