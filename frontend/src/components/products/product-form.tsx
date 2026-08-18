'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, type ProductInput } from '@/lib/validations/schemas'
import { useCreateProduct, useUpdateProduct } from '@/lib/hooks/useProducts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ProductFormProps {
  product?: ProductInput & { id: string }
  mode?: 'create' | 'edit'
}

export default function ProductForm({ product, mode = 'create' }: ProductFormProps) {
  const router = useRouter()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image || null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      name: '',
      purchasePrice: 0,
      sellingPrice: 0,
      gstRate: 18,
      stock: 0,
      lowStock: 10,
      discount: 0,
      discountType: 'AMOUNT',
      isActive: true,
    },
  })

  const discountType = watch('discountType')

  const onSubmit = async (data: ProductInput) => {
    try {
      if (mode === 'edit' && product?.id) {
        await updateProduct.mutateAsync({ id: product.id, data })
        toast.success('Product updated successfully!')
      } else {
        await createProduct.mutateAsync(data)
        toast.success('Product created successfully!')
      }
      router.push('/products')
    } catch (error) {
      toast.error(mode === 'edit' ? 'Failed to update product' : 'Failed to create product')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setValue('image', reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 md:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
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
          {errors.purchasePrice && <p className="text-sm text-destructive">{errors.purchasePrice.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sellingPrice">Selling Price *</Label>
          <Input id="sellingPrice" type="number" step="0.01" {...register('sellingPrice')} />
          {errors.sellingPrice && <p className="text-sm text-destructive">{errors.sellingPrice.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mrp">MRP</Label>
          <Input id="mrp" type="number" step="0.01" {...register('mrp')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock Quantity</Label>
          <Input id="stock" type="number" {...register('stock')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lowStock">Low Stock Alert Level</Label>
          <Input id="lowStock" type="number" {...register('lowStock')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gstRate">GST Rate (%)</Label>
          <Input id="gstRate" type="number" step="0.01" {...register('gstRate')} />
          {errors.gstRate && <p className="text-sm text-destructive">{errors.gstRate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="discount">Discount Value</Label>
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
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode</Label>
          <Input id="barcode" {...register('barcode')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Product Image</Label>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-muted">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground">No Image</span>
            )}
          </div>
          <div>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button type="button" variant="outline" onClick={() => document.getElementById('image')?.click()}>
              Upload Image
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'edit' ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}
