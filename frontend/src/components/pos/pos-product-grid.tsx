'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Product } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Plus } from 'lucide-react'
import Link from 'next/link'

export function POSProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products?limit=50')
        setProducts(data.data.products || data.data)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading products...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name, SKU or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((product) => (
          <Card
            key={product.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              const { useCartStore } = require('@/lib/stores/cart-store')
              const cart = useCartStore.getState()
              const itemTotal = product.sellingPrice * 1
              const discount = product.discountType === 'PERCENTAGE'
                ? (itemTotal * product.discount) / 100
                : product.discount
              const taxable = itemTotal - discount
              const taxAmount = taxable * ((product.cgstRate || product.gstRate) + (product.sgstRate || 0) + (product.igstRate || 0)) / 100
              cart.addItem({
                productId: product.id,
                name: product.name,
                sku: product.sku,
                quantity: 1,
                unitPrice: product.sellingPrice,
                discount: product.discount,
                discountType: product.discountType,
                cgstRate: product.cgstRate || product.gstRate,
                sgstRate: product.sgstRate || 0,
                igstRate: product.igstRate || 0,
                totalAmount: itemTotal + taxAmount,
                image: product.image,
              })
            }}
          >
            <CardContent className="p-3">
              <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">No Image</span>
                )}
              </div>
              <h3 className="font-medium text-sm truncate">{product.name}</h3>
              <p className="text-xs text-muted-foreground">{product.sku || 'No SKU'}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-bold text-sm">{product.sellingPrice.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
