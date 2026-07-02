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
  items: InvoiceItem[]
  subtotal: number
  codFee: number
  totalAmount: number
}

export function drawLogo(doc: InstanceType<typeof PDFDocument>, x: number, y: number, width: number) {
  try {
    const svgPath = path.join(process.cwd(), 'public/logo.svg')
    if (!fs.existsSync(svgPath)) {
      // Fallback to text if file doesn't exist
      doc.fillColor('#D9A321')
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('HONEYLOOMS', x, y)
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
    doc.fillColor('#D9A321')
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('HONEYLOOMS', x, y)
  }
}

export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true,
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', (err) => reject(err))

      // Margins are 40, so printable width is 595 - 80 = 515
      const contentWidth = 515

      // Header section
      let y = 40
      
      // Draw Logo
      drawLogo(doc, 40, y, 160)
      
      // Invoice Title
      doc.fillColor('#141414')
        .font('Helvetica-Bold')
        .fontSize(24)
        .text('INVOICE', 40, y, { align: 'right', width: contentWidth })
      
      y += 50

      // Divider Line
      doc.strokeColor('#e5e5e5')
        .lineWidth(1)
        .moveTo(40, y)
        .lineTo(555, y)
        .stroke()

      y += 20

      // Billing & Invoice details metadata columns
      const billingStartY = y
      
      // Left Column: Billed To
      doc.fillColor('#888888')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('BILLED TO', 40, y)
      
      y += 12
      
      doc.fillColor('#141414')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(data.customerName || 'Customer', 40, y)
      
      y += 14
      
      doc.font('Helvetica')
        .fontSize(9)
        .fillColor('#444444')
      
      const addr = data.shippingAddress
      if (addr.addressLine1) {
        doc.text(addr.addressLine1, 40, y)
        y += 13
      }
      if (addr.addressLine2) {
        doc.text(addr.addressLine2, 40, y)
        y += 13
      }
      
      const cityStateZip = [addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')
      if (cityStateZip) {
        doc.text(cityStateZip, 40, y)
        y += 13
      }
      if (addr.country) {
        doc.text(addr.country, 40, y)
        y += 13
      }
      if (addr.phone) {
        doc.text(`Phone: ${addr.phone}`, 40, y)
        y += 13
      }
      if (data.customerEmail) {
        doc.text(`Email: ${data.customerEmail}`, 40, y)
        y += 13
      }

      const billingEndY = y

      // Reset to top of column for right side
      y = billingStartY

      // Right Column: Invoice metadata
      doc.fillColor('#888888')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('INVOICE DETAILS', 340, y)
      
      y += 12
      
      doc.fillColor('#141414')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('Invoice Number:', 340, y)
      doc.font('Helvetica')
        .text(`#${data.orderId}`, 440, y)
      y += 14

      doc.font('Helvetica-Bold')
        .text('Invoice Date:', 340, y)
      doc.font('Helvetica')
        .text(data.date, 440, y)
      y += 14

      doc.font('Helvetica-Bold')
        .text('Payment Method:', 340, y)
      doc.font('Helvetica')
        .text(data.paymentMethodLabel, 440, y)
      y += 14

      // Use the lower end point to prevent overlaps
      y = Math.max(billingEndY, y) + 20

      // Table Header
      // Background bar for header
      doc.rect(40, y, contentWidth, 20)
        .fillColor('#141414')
        .fill()

      // Header text
      doc.fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('ITEM DESCRIPTION', 45, y + 6, { width: 260, align: 'left' })
        .text('QTY', 305, y + 6, { width: 45, align: 'center' })
        .text('PRICE', 355, y + 6, { width: 80, align: 'right' })
        .text('TOTAL', 440, y + 6, { width: 110, align: 'right' })

      y += 20

      // Items rows
      doc.fontSize(9).fillColor('#141414')
      
      for (const item of data.items) {
        // Page break safety
        if (y > 700) {
          doc.addPage()
          y = 45
          
          // Re-draw table header on new page
          doc.rect(40, y, contentWidth, 20)
            .fillColor('#141414')
            .fill()

          doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(8)
            .text('ITEM DESCRIPTION', 45, y + 6, { width: 260, align: 'left' })
            .text('QTY', 305, y + 6, { width: 45, align: 'center' })
            .text('PRICE', 355, y + 6, { width: 80, align: 'right' })
            .text('TOTAL', 440, y + 6, { width: 110, align: 'right' })

          y += 20
          doc.fontSize(9).fillColor('#141414')
        }

        // Measure description & variant height
        const titleHeight = doc.heightOfString(item.title, { width: 260 })
        const variantHeight = item.variantOptionsText
          ? doc.heightOfString(`Variant: ${item.variantOptionsText}`, { width: 260 }) + 3
          : 0
        const rowHeight = Math.max(26, titleHeight + variantHeight + 10)

        // Draw Row Border
        doc.strokeColor('#f0f0f0')
          .lineWidth(1)
          .moveTo(40, y + rowHeight)
          .lineTo(555, y + rowHeight)
          .stroke()

        // Text Y offset for vertical alignment
        const textY = y + 6
        
        doc.font('Helvetica-Bold')
          .text(item.title, 45, textY, { width: 260, align: 'left' })
        
        if (item.variantOptionsText) {
          doc.font('Helvetica')
            .fillColor('#777777')
            .fontSize(7.5)
            .text(`Variant: ${item.variantOptionsText}`, 45, textY + titleHeight + 2, { width: 260, align: 'left' })
        }

        doc.font('Helvetica')
          .fillColor('#141414')
          .fontSize(9)
          .text(item.quantity.toString(), 305, textY, { width: 45, align: 'center' })
          .text(`INR ${(item.price / 100).toFixed(2)}`, 355, textY, { width: 80, align: 'right' })
          .text(`INR ${(item.total / 100).toFixed(2)}`, 440, textY, { width: 110, align: 'right' })

        y += rowHeight
      }

      y += 15

      // Summary Section
      // Subtotal
      doc.font('Helvetica')
        .fillColor('#666666')
        .text('Subtotal:', 340, y, { width: 95, align: 'right' })
      doc.fillColor('#141414')
        .text(`INR ${(data.subtotal / 100).toFixed(2)}`, 440, y, { width: 110, align: 'right' })
      y += 14

      // COD handling if any
      if (data.codFee > 0) {
        doc.fillColor('#666666')
          .text('COD Fee:', 340, y, { width: 95, align: 'right' })
        doc.fillColor('#141414')
          .text(`INR ${(data.codFee / 100).toFixed(2)}`, 440, y, { width: 110, align: 'right' })
        y += 14
      }

      // Divider for total
      doc.strokeColor('#D9A321')
        .lineWidth(1)
        .moveTo(340, y)
        .lineTo(555, y)
        .stroke()
      
      y += 6

      // Grand Total
      doc.font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#141414')
        .text('Total Amount:', 340, y, { width: 95, align: 'right' })
      doc.fontSize(11)
        .text(`INR ${(data.totalAmount / 100).toFixed(2)}`, 440, y, { width: 110, align: 'right' })

      y += 40

      // Footer
      // Ensure footer isn't cut off
      if (y > 740) {
        doc.addPage()
        y = 50
      } else {
        y = 730
      }

      // Draw footer decorative line
      doc.strokeColor('#e5e5e5')
        .lineWidth(0.5)
        .moveTo(40, y)
        .lineTo(555, y)
        .stroke()

      y += 10

      doc.fillColor('#999999')
        .font('Helvetica')
        .fontSize(7.5)
        .text('Thank you for shopping with Honeylooms!', 40, y, { align: 'center', width: contentWidth })
        .text('For queries, contact us at contact@honeylooms.in. This is a system-generated document.', 40, y + 10, { align: 'center', width: contentWidth })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
