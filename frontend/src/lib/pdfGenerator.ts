import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function generateInvoicePDFFromElement(
  element: HTMLElement,
  invoiceNumber: string
): Promise<Blob> {
  if (!element) {
    throw new Error('Invoice element not found')
  }

  try {
    await document.fonts.ready

    const images = Array.from(element.querySelectorAll('img'))
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve()
            } else {
              img.onload = () => resolve()
              img.onerror = () => resolve()
            }
          })
      )
    )

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: true,
      foreignObjectRendering: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const availableWidth = pageWidth - margin * 2
    const availableHeight = pageHeight - margin * 2

    const imageRatio = canvas.width / canvas.height
    let imgWidth = availableWidth
    let imgHeight = imgWidth / imageRatio

    if (imgHeight > availableHeight) {
      imgHeight = availableHeight
      imgWidth = imgHeight * imageRatio
    }

    const x = (pageWidth - imgWidth) / 2
    const y = (pageHeight - imgHeight) / 2

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST')
    return pdf.output('blob')
  } catch (error) {
    console.error('Invoice PDF generation failed:', error)
    throw error
  }
}
