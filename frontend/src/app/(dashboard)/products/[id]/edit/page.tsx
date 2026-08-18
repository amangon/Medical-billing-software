'use client'

import { useProducts, useUpdateProduct } from '@/lib/hooks/useProducts'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, type ProductInput } from '@/lib/validations/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function EditProductPage() {
  const params = useParams()
  const { data: productData, isLoading } = useProducts()
  const updateProduct = useUpdateProduct()
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    setError,
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
  })

  const discountType = watch('discountType')

  useEffect(() => {
    if (productData) {
      const products = productData.data || productData
      const product = products.find((p: unknown) => (p as { id: string }).id === params.id)
      if (product) {
        const p = product as ProductInput & { id: string }
        reset(p)
        setImagePreview(p.image || null)
      }
    }
  }, [productData, params.id, reset])

  const onSubmit = async (data: ProductInput) => {
    try {
      await updateProduct.mutateAsync({ id: params.id as string, data })
      toast.success('Product updated successfully!')
    } catch (error: any) {
      const err = error?.response?.data
      if (err?.fields) {
        Object.entries(err.fields).forEach(([field, fieldErrors]) => {
          const message = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors
          setError(field as any, { type: 'server', message })
        })
        toast.error(err.message || 'Please fix the errors below')
      } else if (err?.message) {
        toast.error(err.message)
      } else {
        toast.error('Failed to update product')
      }
    }
  };

  if (isLoading) {
     return <div className="flex items-center justify-center h-64">Loading...</div>;
   }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">Update product details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" {...register('sku')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hsnCode">HSN Code</Label>
                <Input id="hsnCode" {...register('hsnCode')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price *</Label>
                <Input id="purchasePrice" type="number" step="0.01" {...register('purchasePrice')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price *</Label>
                <Input id="sellingPrice" type="number" step="0.01" {...register('sellingPrice')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" {...register('stock')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstRate">GST Rate (%)</Label>
                <Input id="gstRate" type="number" step="0.01" {...register('gstRate')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount</Label>
                <Input id="discount" type="number" step="0.01" {...register('discount')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select value={discountType} onValueChange={(value) => setValue('discountType', value as 'AMOUNT' | 'PERCENTAGE')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMOUNT">Amount</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
