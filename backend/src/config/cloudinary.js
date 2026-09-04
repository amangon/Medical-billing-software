import { v4 as uuidv4 } from 'uuid'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from 'cloudinary'

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

let upload: multer.Multer

if (process.env.CLOUDINARY_CLOUD_NAME) {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary.v2,
    params: {
      folder: 'mybill',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
  })
  upload = multer({ storage })
} else {
  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = 'uploads/'
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `${uuidv4()}${ext}`)
    },
  })
  upload = multer({
    storage: localStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp']
      if (allowed.includes(file.mimetype)) cb(null, true)
      else cb(new Error('Invalid file type'))
    },
  })
}

export default upload
