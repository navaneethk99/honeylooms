import { generateInvoicePDF } from '@/utilities/generateInvoicePDF'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Order } from '@/payload-types'
import type { PayloadRequest } from 'payload'

export async function uploadInvoiceToR2(filename: string, buffer: Buffer) {
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
  })

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: `invoices/${filename}`,
    Body: buffer,
    ContentType: 'application/pdf',
  })

  await s3Client.send(command)
}

export async function getOrCreateOrderInvoice(doc: Order, req: PayloadRequest) {
  const payload = req.payload

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

  // 2. Resolve items, prices, and variants
  const resolvedItems = []
  if (doc.items && Array.isArray(doc.items)) {
    for (const item of doc.items) {
      const productID = item.product && typeof item.product === 'object' ? item.product.id : item.product
      const variantID = item.variant && typeof item.variant === 'object' ? item.variant?.id : item.variant

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
          price = (product.onSale && product.salePrice) ? product.salePrice : (product.priceInUSD || 0)
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
  const amount = doc.amount || 0
  const subtotal = amount - codFee

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
      payload.logger.error(`Error fetching transaction for billing address in invoice utility: ${error}`)
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
    totalAmount: amount,
  })

  // 8. Generate standard R2 filename: orderno_custname_date.pdf
  const datePart = new Date(doc.createdAt).toISOString().split('T')[0] // YYYY-MM-DD
  const namePart = customerName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  const r2Filename = `${doc.id}_${namePart || 'customer'}_${datePart}.pdf`

  // 9. Upload to Cloudflare R2 bucket under /invoices
  try {
    await uploadInvoiceToR2(r2Filename, pdfBuffer)
    payload.logger.info(`Invoice uploaded to R2: invoices/${r2Filename}`)
  } catch (err) {
    payload.logger.error(`Error uploading invoice to R2 for order #${doc.id}: ${err}`)
  }

  return {
    pdfBuffer,
    r2Filename,
    toEmail: toEmail || '',
    customerName,
    resolvedItems,
    formattedDate,
    paymentMethodLabel,
    subtotal,
    codFee,
  }
}
