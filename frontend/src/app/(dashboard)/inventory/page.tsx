'use client'

import { useState } from 'react'
import { useInventory } from '@/lib/hooks/useInventory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, AlertTriangle, Warehouse } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'

const adjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  type: z.enum(['ADD', 'REMOVE', 'SET']),
  quantity: z.coerce.number().int(),
  reason: z.string().min(1, 'Reason is required'),
})

type AdjustmentInput = z.infer<typeof adjustmentSchema>

export default function InventoryPage() {
  const { data: inventory, isLoading, refetch } = useInventory()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AdjustmentInput>({
    resolver: zodResolver(adjustmentSchema),
  })

  const items = inventory?.data || inventory || []

  const filtered = items.filter((item: unknown) => {
    const p = item as { name: string; sku?: string }
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    )
  })

  const onSubmit = async (data: AdjustmentInput) => {
    try {
      await fetch('/api/inventory/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      toast.success('Stock adjusted')
      setOpen(false)
      reset()
      refetch()
    } catch {
      toast.error('Failed to adjust stock')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#222222]">Inventory</h1>
          <p className="text-[#6B7280]">Manage stock levels</p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory/adjustments">
            <Button variant="outline" className="rounded-[24px]">Adjustments</Button>
          </Link>
          <Link href="/inventory/transfers">
            <Button variant="outline" className="rounded-[24px]">Transfers</Button>
          </Link>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
              <Button className="rounded-[24px]">Quick Adjust</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Stock Adjustment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inventory-product">Product</Label>
                  <Input id="inventory-product" {...register('productId')} placeholder="Product ID" className="rounded-[24px]" />
                  {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inventory-type">Type</Label>
                  <select id="inventory-type" {...register('type')} className="w-full p-2 border border-border rounded-[24px] bg-white">
                    <option value="ADD">Add</option>
                    <option value="REMOVE">Remove</option>
                    <option value="SET">Set</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inventory-quantity">Quantity</Label>
                  <Input id="inventory-quantity" type="number" {...register('quantity')} className="rounded-[24px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inventory-reason">Reason</Label>
                  <Input id="inventory-reason" {...register('reason')} className="rounded-[24px]" />
                  {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full rounded-[24px]">
                  {isSubmitting ? 'Adjusting...' : 'Adjust Stock'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              placeholder="Search inventory..."
              className="pl-9 bg-[#F8F3EA] border-0 rounded-[24px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#9CA3AF]">
              <Warehouse className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm">No items in inventory</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Low Stock</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item: unknown) => {
                  const p = item as {
                    id: string
                    name: string
                    sku?: string
                    stock: number
                    lowStock: number
                    sellingPrice: number
                  }
                  const isLow = p.stock <= p.lowStock
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link href={`/products/${p.id}`} className="hover:underline">
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell>{p.sku || '-'}</TableCell>
                      <TableCell className={isLow ? 'text-destructive font-medium' : ''}>
                        {p.stock}
                      </TableCell>
                      <TableCell>{p.lowStock}</TableCell>
                      <TableCell>{(p.stock * p.sellingPrice).toFixed(2)}</TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="default">In Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
