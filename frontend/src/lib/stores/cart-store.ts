'use client'

import { create } from 'zustand'

export interface CartItem {
  productId: string
  name: string
  sku?: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'AMOUNT' | 'PERCENTAGE'
  cgstRate: number
  sgstRate: number
  igstRate: number
  totalAmount: number
  image?: string
}

interface CartStore {
  items: CartItem[]
  customerId: string | null
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateDiscount: (productId: string, discount: number, discountType: 'AMOUNT' | 'PERCENTAGE') => void
  setCustomer: (customerId: string | null) => void
  clearCart: () => void
  getSubtotal: () => number
  getTotalTax: () => number
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customerId: null,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        }
      }
      return { items: [...state.items, item] }
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i
      ),
    })),

  updateDiscount: (productId, discount, discountType) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, discount, discountType } : i
      ),
    })),

  setCustomer: (customerId) => set({ customerId }),

  clearCart: () => set({ items: [], customerId: null }),

  getSubtotal: () => {
    const { items } = get()
    return items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity
      const discountAmount =
        item.discountType === 'PERCENTAGE'
          ? (itemTotal * item.discount) / 100
          : item.discount
      return sum + (itemTotal - discountAmount)
    }, 0)
  },

  getTotalTax: () => {
    const { items } = get()
    return items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity
      const discountAmount =
        item.discountType === 'PERCENTAGE'
          ? (itemTotal * item.discount) / 100
          : item.discount
      const taxable = itemTotal - discountAmount
      return sum + taxable * ((item.cgstRate + item.sgstRate + item.igstRate) / 100)
    }, 0)
  },

  getTotal: () => get().getSubtotal() + get().getTotalTax(),

  getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}))
