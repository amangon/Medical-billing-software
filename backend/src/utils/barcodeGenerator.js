import bwipjs from 'bwip-js'

export async function generateBarcode(text, barcodeType = 'code128') {
  try {
    return new Promise((resolve, reject) => {
      bwipjs.toBuffer(
        {
          bcid: barcodeType,
          text,
          scale: 3,
          height: 10,
          includetext: true,
        },
        (err, png) => {
          if (err) reject(err)
          else resolve(Buffer.from(png).toString('base64'))
        }
      )
    })
  } catch (err) {
    throw new Error('Failed to generate barcode')
  }
}

export default { generateBarcode }
