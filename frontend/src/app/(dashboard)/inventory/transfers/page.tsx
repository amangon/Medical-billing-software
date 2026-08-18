'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { toast } from 'react-hot-toast'

export default function InventoryTransfersPage() {
  const [formData, setFormData] = useState({
    productId: '',
    fromLocation: '',
    toLocation: '',
    quantity: 0,
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      toast.success('Stock transferred successfully')
      setFormData({ productId: '', fromLocation: '', toLocation: '', quantity: 0, notes: '' })
    } catch {
      toast.error('Failed to transfer stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#222222]">Stock Transfer</h1>
        <p className="text-[#6B7280]">Transfer stock between locations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product ID</Label>
                <Input
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  required
                  className="rounded-[24px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  required
                  className="rounded-[24px]"
                />
              </div>
              <div className="space-y-2">
                <Label>From Location</Label>
                <Input
                  value={formData.fromLocation}
                  onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                  required
                  className="rounded-[24px]"
                />
              </div>
              <div className="space-y-2">
                <Label>To Location</Label>
                <Input
                  value={formData.toLocation}
                  onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                  required
                  className="rounded-[24px]"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="rounded-[24px]"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="rounded-[24px]">
              {loading ? 'Transferring...' : 'Transfer Stock'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
