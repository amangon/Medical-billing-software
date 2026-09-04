'use client'

import { useState } from 'react'
import { useSalesReport } from '@/lib/hooks/useReports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download } from 'lucide-react'

export default function SalesReportPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const { data: report, isLoading, refetch } = useSalesReport({
    startDate,
    endDate,
  })

  const sales = report?.sales || report?.data || []

  const handleExport = () => {
    const csv = [
      ['Date', 'Order #', 'Customer', 'Amount', 'Status'].join(','),
      ...sales.map((s: unknown) =>
        [
          formatDate((s as { orderDate: string }).orderDate),
          (s as { orderNumber: string }).orderNumber,
          (s as { customer: { name: string } }).customer.name,
          (s as { totalAmount: number }).totalAmount,
          (s as { paymentStatus: string }).paymentStatus,
        ].join(',')
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sales-report.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Report</h1>
          <p className="text-muted-foreground">View and export sales data</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()}>Apply</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">Loading report...</div>
          ) : sales.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sales data found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale: unknown) => {
                  const s = sale as {
                    id: string
                    orderDate: string
                    orderNumber: string
                    customer: { name: string }
                    totalAmount: number
                    paymentStatus: string
                  }
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{formatDate(s.orderDate)}</TableCell>
                      <TableCell className="font-medium">{s.orderNumber}</TableCell>
                      <TableCell>{s.customer.name}</TableCell>
                      <TableCell>{formatCurrency(s.totalAmount)}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                          {s.paymentStatus}
                        </span>
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
