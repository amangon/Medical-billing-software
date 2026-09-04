'use client'

import { useExpenses } from '@/lib/hooks/useExpenses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
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

export default function ExpensesPage() {
  const { data: expensesData, isLoading } = useExpenses()
  const [search, setSearch] = useState('')

  const expenses = expensesData?.data || expensesData || []

  const filtered = expenses.filter((expense: unknown) => {
    const e = expense as { description: string; category: string }
    return (
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
    )
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'RENT': return 'bg-blue-100 text-blue-800'
      case 'SALARY': return 'bg-green-100 text-green-800'
      case 'MARKETING': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track business expenses</p>
        </div>
        <Link href="/expenses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">Loading expenses...</div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No expenses found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((expense: unknown) => {
                  const e = expense as {
                    id: string
                    date: string
                    description: string
                    category: string
                    amount: number
                    paymentMethod?: string
                  }
                  return (
                    <TableRow key={e.id}>
                      <TableCell>{formatDate(e.date)}</TableCell>
                      <TableCell className="font-medium">{e.description}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(e.category)}`}>
                          {e.category}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(e.amount)}</TableCell>
                      <TableCell>{e.paymentMethod || '-'}</TableCell>
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
