import { upload } from '../utils/upload.js'
import path from 'path'

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    const protocol = req.protocol
    const host = req.get('host')
    const url = `${protocol}://${host}/uploads/${req.file.filename}`
    res.json({ url, publicId: req.file.filename })
  } catch (error) {
    next(error)
  }
}

export const uploadMultiple = (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) return next(err)
    const protocol = req.protocol
    const host = req.get('host')
    const files = req.files.map((file) => ({
      url: `${protocol}://${host}/uploads/${file.filename}`,
      publicId: file.filename,
      originalName: file.originalname,
    }))
    res.json({ files })
  })
}
