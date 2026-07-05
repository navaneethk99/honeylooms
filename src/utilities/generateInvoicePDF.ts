import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'

export interface InvoiceItem {
  title: string
  variantOptionsText: string
  quantity: number
  price: number
  total: number
}

export interface InvoiceData {
  orderId: number | string
  date: string
  paymentMethodLabel: string
  customerName: string
  customerEmail: string
  shippingAddress: {
    addressLine1?: string | null
    addressLine2?: string | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    country?: string | null
    phone?: string | null
  }
  billingName?: string | null
  billingAddress?: {
    addressLine1?: string | null
    addressLine2?: string | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    country?: string | null
    phone?: string | null
  } | null
  items: InvoiceItem[]
  subtotal: number
  codFee: number
  totalAmount: number
  discountAmount?: number
}

export function drawLogo(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  width: number,
) {
  try {
    const svgPath = path.join(process.cwd(), 'public/logo.svg')
    if (!fs.existsSync(svgPath)) {
      // Fallback to text if file doesn't exist
      doc.fillColor('#D9A321').font('Helvetica-Bold').fontSize(20).text('HONEYLOOMS', x, y)
      return
    }

    const svgContent = fs.readFileSync(svgPath, 'utf8')
    const paths = svgContent.match(/<path\s+[^>]+?>/gs) || []

    // ViewBox is 0 0 3535 612
    const originalWidth = 3535
    const scale = width / originalWidth

    doc.save()
    doc.translate(x, y)
    doc.scale(scale)

    for (const p of paths) {
      const dMatch = p.match(/d="([^"]+)"/)
      if (!dMatch) continue
      const d = dMatch[1]

      const fillMatch = p.match(/fill="([^"]+)"/)
      const strokeMatch = p.match(/stroke="([^"]+)"/)

      const fillColor = fillMatch ? fillMatch[1] : '#D9A321'
      const strokeColor = strokeMatch ? strokeMatch[1] : undefined

      doc.path(d)
      if (strokeColor && strokeColor !== 'none') {
        doc.strokeColor(strokeColor).lineWidth(15)
        if (fillColor && fillColor !== 'none') {
          doc.fillColor(fillColor).fillAndStroke()
        } else {
          doc.stroke()
        }
      } else if (fillColor && fillColor !== 'none') {
        doc.fillColor(fillColor).fill()
      }
    }

    doc.restore()
  } catch (error) {
    console.error('Error rendering SVG logo in PDF:', error)
    doc.fillColor('#D9A321').font('Helvetica-Bold').fontSize(20).text('HONEYLOOMS', x, y)
  }
}

export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 30, left: 40, right: 40 },
        bufferPages: true,
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', (err) => reject(err))

      // Margins are 40, so printable width is 595 - 80 = 515
      const contentWidth = 515

      // Header section: large bold Title "Invoice" on the left, Order # and Date on the right
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(24).text('Invoice', 40, 40)

      doc
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(`Order #${data.orderId}`, 40, 40, { align: 'right', width: contentWidth })
        .font('Helvetica')
        .text(data.date, 40, 54, { align: 'right', width: contentWidth })

      let y = 90
      const columnsStartY = y

      // Column 1: From
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text('From', 40, y)

      y += 14

      const companyName = process.env.COMPANY_NAME || 'Honeylooms'
      const companyGst = process.env.COMPANY_GST || '[GST NO]'
      const companyAddress = process.env.COMPANY_ADDRESS || '[ADDRESS]'

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#000000')
        .text(companyName, 40, y, { width: 160 })

      y += 13

      doc.text(`GST NO: ${companyGst}`, 40, y, { width: 160 })
      y += 13

      const companyAddressHeight = doc.heightOfString(companyAddress, { width: 160 })
      doc.text(companyAddress, 40, y, { width: 160 })
      const fromEndY = y + companyAddressHeight

      // Column 2: Bill to
      y = columnsStartY
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text('Bill to', 215, y)

      y += 14

      const billAddr = data.billingAddress || data.shippingAddress || {}
      const billName = data.billingName || data.customerName || 'Customer'

      doc.font('Helvetica').fontSize(9).fillColor('#000000').text(billName, 215, y, { width: 160 })

      y += 13

      let billAddressText = ''
      if (billAddr.addressLine1) billAddressText += billAddr.addressLine1 + '\n'
      if (billAddr.addressLine2) billAddressText += billAddr.addressLine2 + '\n'
      const billCityStateZip = [billAddr.city, billAddr.state, billAddr.postalCode]
        .filter(Boolean)
        .join(', ')
      if (billCityStateZip) billAddressText += billCityStateZip + '\n'
      if (billAddr.country) billAddressText += billAddr.country + '\n'
      if (data.customerEmail) billAddressText += data.customerEmail

      const billAddressHeight = doc.heightOfString(billAddressText.trim(), { width: 160 })
      doc.text(billAddressText.trim(), 215, y, { width: 160 })
      const billEndY = y + billAddressHeight

      // Column 3: Ship to
      y = columnsStartY
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text('Ship to', 390, y)

      y += 14

      const shipAddr = data.shippingAddress || {}
      const shipName = data.customerName || 'Customer'

      doc.font('Helvetica').fontSize(9).fillColor('#000000').text(shipName, 390, y, { width: 165 })

      y += 13

      let shipAddressText = ''
      if (shipAddr.addressLine1) shipAddressText += shipAddr.addressLine1 + '\n'
      if (shipAddr.addressLine2) shipAddressText += shipAddr.addressLine2 + '\n'
      const shipCityStateZip = [shipAddr.city, shipAddr.state, shipAddr.postalCode]
        .filter(Boolean)
        .join(', ')
      if (shipCityStateZip) shipAddressText += shipCityStateZip + '\n'
      if (shipAddr.country) shipAddressText += shipAddr.country + '\n'

      const shippingPhone = shipAddr.phone || billAddr.phone
      if (shippingPhone) shipAddressText += shippingPhone

      const shipAddressHeight = doc.heightOfString(shipAddressText.trim(), { width: 165 })
      doc.text(shipAddressText.trim(), 390, y, { width: 165 })
      const shipEndY = y + shipAddressHeight

      y = Math.max(fromEndY, billEndY, shipEndY) + 20

      // Solid thick line separator
      doc.strokeColor('#000000').lineWidth(1.5).moveTo(40, y).lineTo(555, y).stroke()

      y += 15

      // Section Header: Order Details
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11).text('Order Details', 40, y)

      y += 20

      // Table Header: Qty, Item, Price
      doc.strokeColor('#e5e5e5').lineWidth(0.5).moveTo(40, y).lineTo(555, y).stroke()

      doc
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('Qty', 45, y + 5, { width: 40, align: 'left' })
        .text('Item', 90, y + 5, { width: 340, align: 'left' })
        .text('Price', 440, y + 5, { width: 110, align: 'right' })

      doc
        .strokeColor('#e5e5e5')
        .lineWidth(0.5)
        .moveTo(40, y + 20)
        .lineTo(555, y + 20)
        .stroke()

      y += 20

      // Items rows
      doc.font('Helvetica').fontSize(9).fillColor('#000000')

      for (const item of data.items) {
        // Page break safety
        if (y > 700) {
          doc.addPage()
          y = 45

          doc.strokeColor('#e5e5e5').lineWidth(0.5).moveTo(40, y).lineTo(555, y).stroke()

          doc
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .fontSize(9)
            .text('Qty', 45, y + 5, { width: 40, align: 'left' })
            .text('Item', 90, y + 5, { width: 340, align: 'left' })
            .text('Price', 440, y + 5, { width: 110, align: 'right' })

          doc
            .strokeColor('#e5e5e5')
            .lineWidth(0.5)
            .moveTo(40, y + 20)
            .lineTo(555, y + 20)
            .stroke()

          y += 20
          doc.font('Helvetica').fontSize(9).fillColor('#000000')
        }

        const titleHeight = doc.heightOfString(item.title, { width: 340 })
        const variantHeight = item.variantOptionsText
          ? doc.heightOfString(`Variant: ${item.variantOptionsText}`, { width: 340 }) + 3
          : 0
        const rowHeight = Math.max(26, titleHeight + variantHeight + 10)

        const textY = y + 6

        doc
          .font('Helvetica')
          .text(item.quantity.toString(), 45, textY, { width: 40, align: 'left' })

        doc.text(item.title, 90, textY, { width: 340, align: 'left' })

        if (item.variantOptionsText) {
          doc
            .font('Helvetica')
            .fillColor('#555555')
            .fontSize(7.5)
            .text(`Variant: ${item.variantOptionsText}`, 90, textY + titleHeight + 2, {
              width: 340,
              align: 'left',
            })
        }

        doc
          .font('Helvetica')
          .fillColor('#000000')
          .fontSize(9)
          .text(`Rs. ${(item.price / 100).toFixed(2)}`, 440, textY, { width: 110, align: 'right' })

        doc
          .strokeColor('#f0f0f0')
          .lineWidth(0.5)
          .moveTo(40, y + rowHeight)
          .lineTo(555, y + rowHeight)
          .stroke()

        y += rowHeight
      }

      y += 15

      // Summary Box (aligned right)
      const summaryBoxX = 340
      const summaryBoxWidth = 215
      const summaryRowHeight = 20
      const summaryBoxStartY = y

      const discount = data.discountAmount || 0
      const taxableValue = Math.max(0, data.subtotal - discount)

      const summaryRows: Array<{ label: string; subLabel?: string; value: string; isBold?: boolean }> = [
        { label: 'Subtotal', value: `Rs. ${(data.subtotal / 100).toFixed(2)}` },
      ]

      if (discount > 0) {
        summaryRows.push({
          label: 'Discount',
          value: `- Rs. ${(discount / 100).toFixed(2)}`,
        })
      }

      summaryRows.push(
        {
          label: 'Tax',
          subLabel: 'IGST (5%)',
          value: `Rs. ${((taxableValue * 0.05) / 100).toFixed(2)}`,
        },
        { label: 'Shipping (COD)', value: `Rs. ${(data.codFee / 100).toFixed(2)}` },
        { label: 'Total', value: `Rs. ${(data.totalAmount / 100).toFixed(2)}`, isBold: true },
      )

      let currentY = summaryBoxStartY
      for (const row of summaryRows) {
        doc
          .strokeColor('#e5e5e5')
          .lineWidth(0.5)
          .moveTo(summaryBoxX, currentY)
          .lineTo(summaryBoxX + summaryBoxWidth, currentY)
          .stroke()

        doc
          .fillColor('#000000')
          .font(row.isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(9)

        if (row.subLabel) {
          doc
            .text(row.label, summaryBoxX + 5, currentY + 5, { width: 45, align: 'left' })
            .fontSize(7.5)
            .fillColor('#555555')
            .text(row.subLabel, summaryBoxX + 45, currentY + 6, { width: 50, align: 'right' })
        } else {
          doc.text(row.label, summaryBoxX + 5, currentY + 5, { width: 90, align: 'left' })
        }

        doc
          .fontSize(9)
          .fillColor('#000000')
          .font(row.isBold ? 'Helvetica-Bold' : 'Helvetica')
          .text(row.value, summaryBoxX + 100, currentY + 5, { width: 110, align: 'right' })

        currentY += summaryRowHeight
      }

      // Bottom border line for summary box
      doc
        .strokeColor('#e5e5e5')
        .lineWidth(0.5)
        .moveTo(summaryBoxX, currentY)
        .lineTo(summaryBoxX + summaryBoxWidth, currentY)
        .stroke()

      // Left border line
      doc
        .strokeColor('#e5e5e5')
        .lineWidth(0.5)
        .moveTo(summaryBoxX, summaryBoxStartY)
        .lineTo(summaryBoxX, currentY)
        .stroke()
        // Right border line
        .moveTo(summaryBoxX + summaryBoxWidth, summaryBoxStartY)
        .lineTo(summaryBoxX + summaryBoxWidth, currentY)
        .stroke()
        // Column separator vertical divider
        .moveTo(summaryBoxX + 100, summaryBoxStartY)
        .lineTo(summaryBoxX + 100, currentY)
        .stroke()

      y = currentY

      // Signatory Section
      y += 40

      if (y > 700) {
        doc.addPage()
        y = 50
      }

      let signaturePath = process.env.SIGNATURE_IMAGE_PATH
      const defaultSignaturePath = path.join(process.cwd(), 'src/assets/signature.png')
      if (!signaturePath || !fs.existsSync(signaturePath)) {
        signaturePath = defaultSignaturePath
      }

      let sigDrawn = false
      if (signaturePath && fs.existsSync(signaturePath)) {
        try {
          doc.image(signaturePath, 390, y, { width: 140, height: 50 })
          y += 55
          sigDrawn = true
        } catch (err) {
          console.error('Error drawing signature image in PDF:', err)
        }
      }

      if (!sigDrawn) {
        doc
          .strokeColor('#cccccc')
          .lineWidth(0.5)
          .moveTo(390, y + 45)
          .lineTo(555, y + 45)
          .stroke()
        y += 50
      }

      doc
        .fillColor('#000000')
        .font('Helvetica')
        .fontSize(9)
        .text('Authorised Signatory', 390, y, { width: 165, align: 'center' })

      // Footer Contact Info
      const pageHeight = doc.page.height
      const footerY = pageHeight - 65

      doc.strokeColor('#e5e5e5').lineWidth(0.5).moveTo(40, footerY).lineTo(555, footerY).stroke()

      const contactEmail = process.env.SMTP_FROM_ADDRESS || 'contact@honeylooms.in'
      doc
        .fillColor('#555555')
        .font('Helvetica')
        .fontSize(8.5)
        .text(
          `If you have any questions, please send an email to ${contactEmail}`,
          40,
          footerY + 10,
          { align: 'left', width: contentWidth },
        )

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
