export interface Product {
  id: string
  name: string
  description?: string
  sku?: string
  hsnCode?: string
  barcode?: string
  purchasePrice: number
  sellingPrice: number
  mrp?: number
  discount: number
  discountType: 'AMOUNT' | 'PERCENTAGE'
  gstRate: number
  cgstRate?: number
  sgstRate?: number
  igstRate?: number
  stock: number
  lowStock: number
  image?: string
  isActive: boolean
  categoryId?: string
  brandId?: string
  unitId?: string
  category?: { id: string; name: string; color?: string }
  brand?: { id: string; name: string; logo?: string }
  unit?: { id: string; name: string; abbreviation: string }
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  description?: string
  color?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Brand {
  id: string
  name: string
  description?: string
  logo?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstin?: string
  creditLimit: number
  openingBalance: number
  currentBalance: number
  totalPurchases: number
  totalPaid: number
  lastPurchaseAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  name: string
  email?: string
  phone: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstin?: string
  creditLimit: number
  currentBalance: number
  totalPurchases: number
  totalPaid: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  orderNumber: string
  orderDate: string
  subTotal: number
  discountAmount: number
  discountType: 'AMOUNT' | 'PERCENTAGE'
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  paymentMethod?: string
  paymentStatus: string
  orderStatus: string
  notes?: string
  customerId: string
  customer: Customer
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'AMOUNT' | 'PERCENTAGE'
  cgstRate: number
  sgstRate: number
  igstRate: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalAmount: number
  productId: string
  product: Product
}

export interface Purchase {
  id: string
  purchaseNumber: string
  purchaseDate: string
  subTotal: number
  discountAmount: number
  discountType: 'AMOUNT' | 'PERCENTAGE'
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  paymentStatus: string
  purchaseStatus: string
  notes?: string
  supplierId: string
  supplier: Supplier
  items: PurchaseItem[]
  createdAt: string
  updatedAt: string
}

export interface PurchaseItem {
  id: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'AMOUNT' | 'PERCENTAGE'
  cgstRate: number
  sgstRate: number
  igstRate: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalAmount: number
  productId: string
  product: Product
}

export interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  dueDate?: string
  subTotal: number
  discountAmount: number
  discountType: 'AMOUNT' | 'PERCENTAGE'
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  paymentMethod?: string
  paymentStatus: string
  invoiceType: string
  notes?: string
  termsConditions?: string
  pdfUrl?: string
  isPrinted: boolean
  isShared: boolean
  customerId: string
  customer: Customer
  items: InvoiceItem[]
  createdAt: string
  updatedAt: string
}

export interface InvoiceItem {
  id: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'AMOUNT' | 'PERCENTAGE'
  cgstRate: number
  sgstRate: number
  igstRate: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalAmount: number
  productId: string
  product: Product
}

export interface Payment {
  id: string
  amount: number
  paymentMethod: string
  paymentDate: string
  reference?: string
  notes?: string
  customer?: Customer
  supplier?: Supplier
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  amount: number
  category: string
  description: string
  paymentMethod?: string
  reference?: string
  date: string
  createdAt: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: string
}

export interface DashboardStats {
  todaySales: number
  todayPurchases: number
  todayRevenue: number
  todayProfit: number
  totalOrders: number
  inventoryValue: number
  lowStockCount: number
  expiryCount: number
  monthlySales: { month: string; sales: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
}
