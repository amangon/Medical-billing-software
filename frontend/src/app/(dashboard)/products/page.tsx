'use client'

import { useProducts, useDeleteProduct } from '@/lib/hooks/useProducts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Plus, Edit, Trash2, PackageOpen } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ScrollAnimate, StaggerItem } from '@/components/animations'
import { fadeInUp } from '@/lib/animations'

export default function ProductsPage() {
  const { data: productsData, isLoading } = useProducts()
  const deleteProduct = useDeleteProduct()
  const [search, setSearch] = useState('')

  const products = productsData?.data || productsData || []

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
try {
       await deleteProduct.mutateAsync(id)
       toast.success('Product deleted')
     } catch {
       toast.error('Failed to delete product')
     }
   };

  const filtered = products.filter((p: unknown) => {
    const product = p as { name: string; sku?: string; barcode?: string }
    return (
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(search.toLowerCase())
    )
  })

  if (isLoading) {
     return <div className="flex items-center justify-center h-64">Loading products...</div>;
   }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <div className="flex gap-2">
          <Link href="/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="product-search"
                placeholder="Search products by name, SKU or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
{filtered.map((product: unknown) => {
                 const p = product as {
                   id: string
                   name: string
                   sku?: string
                   sellingPrice: number | string
                   stock: number
                   gstRate: number
                   isActive: boolean
                 }
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.sku || '-'}</TableCell>
                    <TableCell>{isNaN(Number(p.sellingPrice)) ? '0.00' : Number(p.sellingPrice).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={p.stock < 10 ? 'text-destructive font-medium' : ''}>
                        {p.stock}
                      </span>
                    </TableCell>
                    <TableCell>{p.gstRate}%</TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? 'default' : 'secondary'}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/products/${p.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
