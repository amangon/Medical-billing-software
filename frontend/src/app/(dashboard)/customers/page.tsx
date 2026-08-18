'use client'

import { useCustomers } from '@/lib/hooks/useCustomers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Phone, Mail, MapPin } from 'lucide-react'
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
import { formatCurrency } from '@/lib/utils'

export default function CustomersPage() {
  const { data: customersData, isLoading, isError, error } = useCustomers()
  const [search, setSearch] = useState('')

  const customers = customersData?.data || customersData || []

  const filtered = customers.filter((customer: unknown) => {
    const c = customer as { name: string; email?: string; phone: string }
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customers</p>
        </div>
        <Link href="/customers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">Loading customers...</div>
          ) : isError ? (
            <div className="flex items-center justify-center h-64 text-destructive">
              Failed to load customers: {(error as Error)?.message || 'Unknown error'}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No customers found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Total Purchases</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((customer: unknown) => {
                  const c = customer as {
                    id: string
                    name: string
                    phone: string
                    email?: string
                    currentBalance: number
                    totalPurchases: number
                    isActive: boolean
                  }
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <Link href={`/customers/${c.id}`} className="hover:underline">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {c.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {c.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(c.currentBalance)}</TableCell>
                      <TableCell>{formatCurrency(c.totalPurchases)}</TableCell>
                      <TableCell>
                        <Badge variant={c.isActive ? 'default' : 'secondary'}>
                          {c.isActive ? 'Active' : 'Inactive'}
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
