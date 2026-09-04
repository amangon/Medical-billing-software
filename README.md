# 🏥 Medical Billing Software

![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-blue?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=blue)
![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38BDF8?logo=tailwind-css&logoColor=white)
![ShadCN UI](https://img.shields.io/badge/ShadCN_UI-latest-black?logo=shadcnui&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-black?logo=express&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-red?logo=json-web-tokens&logoColor=white)
![PDFKit](https://img.shields.io/badge/PDFKit-0.13.0-purple?logo=pdfkit&logoColor=white)
![QRCode](https://img.shields.io/badge/QRCode-1.5.3-black?logo=qr-code&logoColor=white)

> A modern, full-stack Medical Billing & ERP platform with GST-compliant invoicing, real-time inventory management, and professional PDF generation.

---

## 📸 Screenshots

> _Add your screenshots here_

```
📊 Dashboard          🧾 Invoice Preview       📋 Product Inventory
┌─────────────────┐  ┌─────────────────────┐  ┌──────────────────┐
│ Total Sales     │  │ TAX INVOICE         │  │ Product Name     │
│ Total Invoices  │  │ [QR Code] [UPI]    │  │ HSN/SAC          │
│ Total Customers │  │ Item Table ...     │  │ Batch / Expiry   │
│ Total Products  │  │ Summary ...        │  │ Stock Qty        │
└─────────────────┘  └─────────────────────┘  └──────────────────┘
```

---

## ✨ Key Features

### 🧾 Smart Invoicing
- **GST-Compliant Invoices** — CGST / SGST / IGST / CESS with automatic calculation
- **Professional PDF Generation** — A4 portrait, exact DOM-to-PDF rendering via `html2canvas` + `jsPDF`
- **UPI QR Payments** — Auto-generated QR codes from business UPI ID (`upi://pay?...`)
- **Amount in Words** — Indian numbering system (Lakh/Crore) with Paise support
- **Multiple Invoice Types** — TAX / NON-TAX / PROFORMA

### 📦 Inventory & Products
- **Product Management** — HSN/SAC, batch tracking, expiry dates
- **Stock Movements** — Automatic stock updates on invoice creation
- **Category & Brand Management** — Organize products efficiently
- **Low Stock Alerts** — Real-time notifications

### 👥 Customer & Supplier Management
- **Customer Profiles** — GSTIN, billing/shipping addresses
- **Supplier Management** — Purchase orders and transactions
- **Ledger & Payments** — Track payments, balances, and dues

### 📊 Analytics & Reports
- **Dashboard Stats** — Total sales, invoices, customers, products
- **GST Reports** — Tax summary for filing
- **Sales Reports** — Date-wise analytics

### ⚙️ Settings & Customization
- **Business Profile** — Logo, signature, GSTIN, PAN, address
- **Bank Details** — Account number, IFSC, UPI ID
- **Invoice Settings** — Prefix, currency, tax rates
- **Theme Support** — Light / Dark mode

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **ShadCN UI** | Component library |
| **Framer Motion** | Animations |
| **React Query** | Server state management |
| **React Hot Toast** | Notifications |
| **QRCode.react** | QR rendering |
| **html2canvas + jsPDF** | PDF generation |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **Express.js** | API server |
| **Prisma ORM** | Database access |
| **PostgreSQL** | Primary database |
| **JWT** | Authentication |
| **bcryptjs** | Password hashing |
| **Multer** | File uploads |
| **PDFKit** | PDF generation |
| **QRCode** | QR code generation |
| **Sharp** | Image processing |
| **Nodemailer** | Email service |
| **Cloudinary** | Cloud storage (optional) |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone https://github.com/amangon/Medical-billing-software.git
cd Medical-billing-software
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Start backend server
npm run dev
```
Backend runs at: `https://medical-billing-software-yc6q.onrender.com`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:3000`

### 4. Create Admin User
```bash
cd backend
node prisma/seed.js
# Or use the signup page at http://localhost:3000/signup
```

---

## ⚙️ Environment Variables

### Backend `.env`
```env
NODE_ENV=development
PORT=5001
DATABASE_URL="postgresql://username:password@localhost:5432/mybill?schema=public"
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_REFRESH_SECRET=your_refresh_secret_key_here_change_in_production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=https://medical-billing-software-yc6q.onrender.com/api
```

---

## 📂 Project Structure

```
Medical-billing-software/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── services/         # Business logic
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth, validation, errors
│   │   ├── config/           # Database, cloudinary
│   │   ├── utils/            # PDF generator, QR, storage
│   │   └── server.js         # Express entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/       # Migration files
│   ├── uploads/              # Uploaded files
│   └── .env                  # Backend config
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # Utilities, API, hooks
│   │   └── hooks/            # Custom React hooks
│   ├── public/               # Static assets
│   └── next.config.js        # Next.js config
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh-token` | Refresh JWT token |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List invoices |
| GET | `/api/invoices/:id` | Get invoice by ID |
| POST | `/api/invoices` | Create invoice |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| PUT | `/api/invoices/:id/status` | Update status |
| GET | `/api/invoices/:id/pdf` | Download PDF |
| GET | `/api/invoices/:id/print` | Print view |
| POST | `/api/invoices/:id/share` | Share invoice |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get business settings |
| PUT | `/api/settings` | Update settings |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/image` | Upload image (logo/signature) |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

---

## 🐛 Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| `next/image` localhost error | Added `localhost:5001` to `next.config.js` remotePatterns |
| PDF font errors | Using `html2canvas` DOM capture instead of manual jsPDF fonts |
| Controlled input warnings | Normalized all form values with `?? ""` |
| Upload 400 errors | Removed hardcoded `Content-Type` from axios instance |
| Query undefined errors | All `useQuery` hooks return safe fallbacks |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Aman Lal**

---

## ⭐ Support

If you found this project helpful, please give it a ⭐️!

---

<div align="center">
  <sub>Built with ❤️ for modern medical billing</sub>
</div>
