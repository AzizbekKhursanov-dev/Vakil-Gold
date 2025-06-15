// PDF generation utilities for supplier documents and payment receipts

export async function generateSupplierConfirmationPDF(data: {
  documentNumber: string
  supplierName: string
  items: any[]
  adminNotes?: string
  createdDate: string
}) {
  // Create a simple PDF content as HTML string
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ta'minotchi Tasdiqlash Hujjati</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .document-title { font-size: 18px; margin-bottom: 20px; }
        .info-section { margin-bottom: 20px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .signature-section { margin-top: 40px; }
        .signature-box { border: 1px solid #000; height: 80px; margin-top: 10px; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">VAKIL GOLD</div>
        <div class="document-title">TA'MINOTCHI TASDIQLASH HUJJATI</div>
      </div>

      <div class="info-section">
        <div class="info-row">
          <span><strong>Hujjat raqami:</strong> ${data.documentNumber}</span>
          <span><strong>Sana:</strong> ${new Date(data.createdDate).toLocaleDateString()}</span>
        </div>
        <div class="info-row">
          <span><strong>Ta'minotchi:</strong> ${data.supplierName}</span>
          <span><strong>Mahsulotlar soni:</strong> ${data.items.length} ta</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>Model</th>
            <th>Kategoriya</th>
            <th>Og'irlik (g)</th>
            <th>Lom narxi (so'm/g)</th>
            <th>Jami qiymat (so'm)</th>
          </tr>
        </thead>
        <tbody>
          ${data.items
            .map(
              (item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.model}</td>
              <td>${item.category}</td>
              <td>${item.weight}</td>
              <td>${(item.lomNarxi || 0).toLocaleString()}</td>
              <td>${((item.weight || 0) * (item.lomNarxi || 0)).toLocaleString()}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="info-section">
        <div><strong>Jami og'irlik:</strong> ${data.items.reduce((sum, item) => sum + (item.weight || 0), 0).toFixed(2)} g</div>
        <div><strong>Jami qiymat:</strong> ${data.items.reduce((sum, item) => sum + (item.weight || 0) * (item.lomNarxi || 0), 0).toLocaleString()} so'm</div>
      </div>

      ${
        data.adminNotes
          ? `
        <div class="info-section">
          <strong>Admin izohi:</strong>
          <div style="border: 1px solid #ddd; padding: 10px; margin-top: 5px;">
            ${data.adminNotes}
          </div>
        </div>
      `
          : ""
      }

      <div class="signature-section">
        <div style="display: flex; justify-content: space-between;">
          <div style="width: 45%;">
            <div><strong>Ta'minotchi imzosi:</strong></div>
            <div class="signature-box"></div>
            <div style="margin-top: 10px;">F.I.O: _________________</div>
            <div>Sana: _________________</div>
          </div>
          <div style="width: 45%;">
            <div><strong>Kompaniya vakili imzosi:</strong></div>
            <div class="signature-box"></div>
            <div style="margin-top: 10px;">F.I.O: _________________</div>
            <div>Sana: _________________</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Ushbu hujjat yuqorida ko'rsatilgan mahsulotlarning ta'minotchi tomonidan tasdiqlanganligini bildiradi.</p>
        <p>Hujjat yaratilgan sana: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `

  // Convert HTML to PDF blob (simplified version)
  // In a real application, you would use a proper PDF library like jsPDF or Puppeteer
  const blob = new Blob([htmlContent], { type: "text/html" })

  // For demonstration, we'll create a simple text file
  // In production, use proper PDF generation
  const pdfContent = `
TA'MINOTCHI TASDIQLASH HUJJATI

Hujjat raqami: ${data.documentNumber}
Sana: ${new Date(data.createdDate).toLocaleDateString()}
Ta'minotchi: ${data.supplierName}
Mahsulotlar soni: ${data.items.length} ta

MAHSULOTLAR RO'YXATI:
${data.items
  .map(
    (item, index) =>
      `${index + 1}. ${item.model} - ${item.category} - ${item.weight}g - ${(item.lomNarxi || 0).toLocaleString()} so'm/g`,
  )
  .join("\n")}

Jami og'irlik: ${data.items.reduce((sum, item) => sum + (item.weight || 0), 0).toFixed(2)} g
Jami qiymat: ${data.items.reduce((sum, item) => sum + (item.weight || 0) * (item.lomNarxi || 0), 0).toLocaleString()} so'm

${data.adminNotes ? `Admin izohi: ${data.adminNotes}` : ""}

Ta'minotchi imzosi: _________________ Sana: _________________
Kompaniya vakili imzosi: _________________ Sana: _________________
  `

  return new Blob([pdfContent], { type: "application/pdf" })
}

export async function generatePaymentReceiptPDF(data: {
  supplierName: string
  totalAmount: number
  payedLomNarxi: number
  paymentDate: string
  reference?: string
  notes?: string
  items: any[]
  attachments?: any[]
}) {
  const receiptContent = `
TO'LOV KVITANSIYASI

Ta'minotchi: ${data.supplierName}
To'lov miqdori: ${data.totalAmount.toLocaleString()} so'm
To'langan lom narxi: ${data.payedLomNarxi.toLocaleString()} so'm/g
To'lov sanasi: ${new Date(data.paymentDate).toLocaleDateString()}
${data.reference ? `Ma'lumotnoma: ${data.reference}` : ""}

TO'LANGAN MAHSULOTLAR:
${data.items
  .map(
    (item, index) =>
      `${index + 1}. ${item.model} - ${item.weight}g - ${((item.weight || 0) * data.payedLomNarxi).toLocaleString()} so'm`,
  )
  .join("\n")}

Jami mahsulotlar: ${data.items.length} ta
Jami og'irlik: ${data.items.reduce((sum, item) => sum + (item.weight || 0), 0).toFixed(2)} g
Jami to'lov: ${data.totalAmount.toLocaleString()} so'm

${data.attachments && data.attachments.length > 0 ? `Qo'shimcha hujjatlar: ${data.attachments.length} ta fayl` : ""}

${data.notes ? `Izohlar: ${data.notes}` : ""}

Yaratilgan sana: ${new Date().toLocaleString()}
  `

  return new Blob([receiptContent], { type: "application/pdf" })
}
