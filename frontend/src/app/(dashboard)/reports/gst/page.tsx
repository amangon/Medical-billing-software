'use client'

import { useState } from 'react'
import { useGSTReport } from '@/lib/hooks/useReports'
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

export default function GSTReportPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const { data: report, isLoading, refetch } = useGSTReport({
    startDate,
    endDate,
  })

  const invoices = report?.invoices || report?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">GST Report</h1>
        <p className="text-muted-foreground">GST summary and details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()}>Apply</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total CGST</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(report?.totalCGST || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total SGST</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(report?.totalSGST || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total IGST</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(report?.totalIGST || 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">Loading report...</div>
          ) : invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No GST data found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>CGST</TableHead>
                  <TableHead>SGST</TableHead>
                  <TableHead>IGST</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: unknown) => {
                  const i = inv as {
                    id: string
                    invoiceNumber: string
                    invoiceDate: string
                    customer: { name: string }
                    cgstAmount: number
                    sgstAmount: number
                    igstAmount: number
                    totalAmount: number
                  }
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.invoiceNumber}</TableCell>
                      <TableCell>{formatDate(i.invoiceDate)}</TableCell>
                      <TableCell>{i.customer.name}</TableCell>
                      <TableCell>{formatCurrency(i.cgstAmount)}</TableCell>
                      <TableCell>{formatCurrency(i.sgstAmount)}</TableCell>
                      <TableCell>{formatCurrency(i.igstAmount)}</TableCell>
                      <TableCell>{formatCurrency(i.totalAmount)}</TableCell>
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
