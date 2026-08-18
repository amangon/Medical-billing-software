'use client'

import { useState } from 'react'
import { useInventoryAlerts } from '@/lib/hooks/useInventory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function InventoryAdjustmentsPage() {
  const { data: alerts, isLoading } = useInventoryAlerts()

  const lowStock = alerts?.lowStock || []
  const expiring = alerts?.expiring || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#222222]">Inventory Alerts</h1>
        <p className="text-[#6B7280]">Monitor stock levels and expiry dates</p>
      </div>

      <Tabs defaultValue="low-stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
        </TabsList>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Low Stock Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : lowStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-[#9CA3AF]">
                  <AlertTriangle className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No low stock alerts</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Low Stock Threshold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStock.map((item: unknown) => {
                      const p = item as { id: string; name: string; sku?: string; stock: number; lowStock: number }
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.sku || '-'}</TableCell>
                          <TableCell className="text-destructive font-medium">{p.stock}</TableCell>
                          <TableCell>{p.lowStock}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-500" />
                Expiring Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : expiring.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-[#9CA3AF]">
                  <Calendar className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No expiring products</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Days Left</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiring.map((item: unknown) => {
                      const p = item as { id: string; name: string; sku?: string; batchNumber: string; expiryDate: string }
                      const daysLeft = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.sku || '-'}</TableCell>
                          <TableCell>{p.batchNumber}</TableCell>
                          <TableCell>{formatDate(p.expiryDate)}</TableCell>
                          <TableCell>
                            <Badge variant={daysLeft < 30 ? 'destructive' : 'secondary'}>
                              {daysLeft} days
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
