'use client'

import { usePurchases } from '@/lib/hooks/usePurchases'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function PurchasesPage() {
  const { data: purchasesData, isLoading } = usePurchases()
  const [search, setSearch] = useState('')

  const purchases = purchasesData?.data || purchasesData || []

  const filtered = purchases.filter((purchase: unknown) => {
    const p = purchase as { purchaseNumber: string; supplier: { name: string } }
    return (
      p.purchaseNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.supplier?.name || '').toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#222222]">Purchases</h1>
          <p className="text-[#6B7280]">Manage supplier purchases</p>
        </div>
        <Link href="/purchases/new">
          <Button className="rounded-[24px]">
            <Plus className="mr-2 h-4 w-4" />
            New Purchase
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="Search purchases..."
                className="pl-9 bg-[#F8F3EA] border-0 rounded-[24px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-[24px]">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-[#9CA3AF]">Loading purchases...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#9CA3AF]">
              <ShoppingBag className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm">No purchases yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((purchase: unknown) => {
                  const p = purchase as {
                    id: string
                    purchaseNumber: string
                    supplier: { name: string }
                    purchaseDate: string
                    totalAmount: number
                    purchaseStatus: string
                  }
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.purchaseNumber}</TableCell>
                      <TableCell>{p.supplier?.name || '-'}</TableCell>
                      <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                      <TableCell>{formatCurrency(p.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={p.purchaseStatus === 'RECEIVED' ? 'default' : 'secondary'}>
                          {p.purchaseStatus}
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
    </div>
  )
}
