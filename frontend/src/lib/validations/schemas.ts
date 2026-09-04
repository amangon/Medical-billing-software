import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
})

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  hsnCode: z.string().optional(),
  barcode: z.string().optional(),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  mrp: z.coerce.number().optional(),
  discount: z.coerce.number().min(0).default(0),
  discountType: z.enum(['AMOUNT', 'PERCENTAGE']).default('AMOUNT'),
  gstRate: z.coerce.number().min(0).max(100).default(18),
  cgstRate: z.coerce.number().optional(),
  sgstRate: z.coerce.number().optional(),
  igstRate: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  lowStock: z.coerce.number().int().min(0).default(10),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  unitId: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const customerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  creditLimit: z.coerce.number().min(0).default(0),
})

export const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  creditLimit: z.coerce.number().min(0).default(0),
})

export const orderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.coerce.number().int().min(1),
      unitPrice: z.coerce.number().min(0),
      discount: z.coerce.number().min(0).default(0),
      discountType: z.enum(['AMOUNT', 'PERCENTAGE']).default('AMOUNT'),
      cgstRate: z.coerce.number().default(18),
      sgstRate: z.coerce.number().default(0),
      igstRate: z.coerce.number().default(0),
    })
  ).min(1, 'At least one item is required'),
  discountAmount: z.coerce.number().min(0).default(0),
  discountType: z.enum(['AMOUNT', 'PERCENTAGE']).default('AMOUNT'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
})

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.coerce.number().int().min(1),
      unitPrice: z.coerce.number().min(0),
      discount: z.coerce.number().min(0).default(0),
      discountType: z.enum(['AMOUNT', 'PERCENTAGE']).default('AMOUNT'),
      cgstRate: z.coerce.number().default(18),
      sgstRate: z.coerce.number().default(0),
      igstRate: z.coerce.number().default(0),
    })
  ).min(1, 'At least one item is required'),
  discountAmount: z.coerce.number().min(0).default(0),
  discountType: z.enum(['AMOUNT', 'PERCENTAGE']).default('AMOUNT'),
  notes: z.string().optional(),
})

export const expenseSchema = z.object({
  amount: z.coerce.number().min(0, 'Amount is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  date: z.string().optional(),
})

export const invoiceSchema = z.object({
  customerId: z.string().optional(),
  isWalkIn: z.boolean().default(false),
  invoiceDate: z.string().date('Invalid date'),
  dueDate: z.string().date('Invalid date').optional().or(z.literal('')),
  invoiceType: z.enum(['TAX', 'NON_TAX', 'PROFORMA']).default('TAX'),
  notes: z.string().optional(),
  termsConditions: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  salespersonId: z.string().optional(),
  discountAmount: z.coerce.number().min(0).default(0),
  discountType: z.enum(['AMOUNT', 'PERCENTAGE']).default('AMOUNT'),
  payment: z
    .object({
      paymentMethod: z.string().optional(),
      paymentStatus: z.string().optional(),
      paidAmount: z.coerce.number().min(0).default(0),
      reference: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.coerce.number().int().min(1),
      unitPrice: z.coerce.number().min(0),
      discount: z.coerce.number().min(0).default(0),
      discountType: z.enum(['AMOUNT', 'PERCENTAGE']).default('AMOUNT'),
      cgstRate: z.coerce.number().default(18),
      sgstRate: z.coerce.number().default(0),
      igstRate: z.coerce.number().default(0),
    })
  ).min(1, 'At least one item is required'),
}).superRefine((data, ctx) => {
  if (!data.isWalkIn && !data.customerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Customer is required or enable walk-in mode',
      path: ['customerId'],
    });
  }
});

export interface InvoicePayment {
  paymentMethod?: string
  paymentStatus?: string
  paidAmount?: number
  reference?: string
  notes?: string
}

export interface InvoiceItemInput {
  productId: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'AMOUNT' | 'PERCENTAGE'
  cgstRate: number
  sgstRate: number
  igstRate: number
}

export const paymentSchema = z.object({
  amount: z.coerce.number().min(0, 'Amount is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  invoiceId: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export const inventoryAdjustmentSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().int().positive(),
  type: z.enum(['INCREASE', 'DECREASE']),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ProductInput = z.infer<typeof productSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type SupplierInput = z.infer<typeof supplierSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type PurchaseInput = z.infer<typeof purchaseSchema>
export type ExpenseInput = z.infer<typeof expenseSchema>
export type InvoiceInput = z.infer<typeof invoiceSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>
