import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendVerificationEmail(email, name, token) {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`
  await transporter.sendMail({
    from: `"MyBill" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your email address',
    html: `<p>Hi ${name},</p><p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
  })
}

export async function sendPasswordResetEmail(email, name, token) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`
  await transporter.sendMail({
    from: `"MyBill" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your password',
    html: `<p>Hi ${name},</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
  })
}

export async function sendInvoiceEmail(email, name, pdfBuffer, invoiceNumber) {
  await transporter.sendMail({
    from: `"MyBill" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Invoice ${invoiceNumber}`,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
    html: `<p>Hi ${name},</p><p>Please find attached your invoice.</p>`,
  })
}

export default transporter
