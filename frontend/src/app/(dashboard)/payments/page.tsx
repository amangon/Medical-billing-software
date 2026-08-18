'use client'

import { usePayments } from '@/lib/hooks/usePayments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
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

export default function PaymentsPage() {
  const { data: paymentsData, isLoading } = usePayments()
  const [search, setSearch] = useState('')

  const payments = paymentsData?.data || paymentsData || []

  const filtered = payments.filter((payment: unknown) => {
    const p = payment as { reference?: string; customer?: { name: string }; supplier?: { name: string } }
    return (
      p.reference?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier?.name.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Track all payments</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">Loading payments...</div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No payments found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer/Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((payment: unknown) => {
                  const p = payment as {
                    id: string
                    amount: number
                    paymentMethod: string
                    paymentDate: string
                    reference?: string
                    customer?: { name: string }
                    supplier?: { name: string }
                  }
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.paymentDate)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell>{p.reference || '-'}</TableCell>
                      <TableCell>{p.customer?.name || p.supplier?.name || '-'}</TableCell>
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
