import QRCode from 'qrcode'

export async function generateQRCode(text) {
  try {
    const url = await QRCode.toDataURL(text)
    return url
  } catch (err) {
    throw new Error('Failed to generate QR code')
  }
}

export async function generateUPIQR(upiId, name, amount) {
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&cu=INR${amount ? `&am=${amount}` : ''}`
  return generateQRCode(upiString)
}

export default { generateQRCode, generateUPIQR }
