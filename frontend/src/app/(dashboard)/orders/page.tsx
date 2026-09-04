'use client'

import { useOrders } from '@/lib/hooks/useOrders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, PackageOpen } from 'lucide-react'
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
import { formatCurrency, formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-[#CFECC7] text-[#166534]',
  PENDING: 'bg-[#F8D96B] text-[#92400E]',
  PROCESSING: 'bg-[#BFD8FF] text-[#1E3A8A]',
  CANCELLED: 'bg-red-100 text-red-800',
}

const PAYMENT_COLORS: Record<string, string> = {
  PAID: 'bg-[#CFECC7] text-[#166534]',
  PENDING: 'bg-[#F8D96B] text-[#92400E]',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-[#D9C6FF] text-[#5B21B6]',
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

export default function OrdersPage() {
  const { data: ordersData, isLoading } = useOrders()
  const [search, setSearch] = useState('')

  const orders = ordersData?.data || ordersData || []

  const filtered = orders.filter((order: unknown) => {
    const o = order as { orderNumber: string; customer: { name: string } }
    return (
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#222222]">Orders</h1>
          <p className="text-[#6B7280]">Manage customer orders</p>
        </div>
        <Link href="/orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="Search orders..."
                className="pl-9 bg-[#F8F3EA] rounded-[24px] border-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="border-2 border-primary border-t-transparent rounded-full animate-spin h-8 w-8" />
              <p className="text-[#6B7280] text-sm">Loading orders...</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 text-[#9CA3AF]"
            >
              <PackageOpen className="mx-auto h-12 w-12 mb-3 opacity-40" />
              <p className="font-medium">No orders found</p>
              <p className="text-sm mt-1">Try adjusting your search or create a new order</p>
            </motion.div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#6B7280] font-medium">Order #</TableHead>
                    <TableHead className="text-[#6B7280] font-medium">Customer</TableHead>
                    <TableHead className="text-[#6B7280] font-medium">Date</TableHead>
                    <TableHead className="text-[#6B7280] font-medium">Amount</TableHead>
                    <TableHead className="text-[#6B7280] font-medium">Status</TableHead>
                    <TableHead className="text-[#6B7280] font-medium">Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order: unknown) => {
                    const o = order as {
                      id: string
                      orderNumber: string
                      customer: { name: string }
                      orderDate: string
                      totalAmount: number
                      orderStatus: string
                      paymentStatus: string
                    }
                    const statusColor = STATUS_COLORS[o.orderStatus] || 'bg-gray-100 text-gray-800'
                    const paymentColor = PAYMENT_COLORS[o.paymentStatus] || 'bg-gray-100 text-gray-800'
                    return (
                      <motion.tr
                        key={o.id}
                        variants={fadeInUp}
                        className="border-b border-border/50 transition-colors hover:bg-[#F8F3EA]/50"
                      >
                        <TableCell className="font-medium text-[#222222]">{o.orderNumber}</TableCell>
                        <TableCell className="text-[#222222]">{o.customer.name}</TableCell>
                        <TableCell className="text-[#6B7280]">{formatDate(o.orderDate)}</TableCell>
                        <TableCell className="text-[#222222] font-medium">{formatCurrency(o.totalAmount)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {o.orderStatus}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${paymentColor}`}>
                            {o.paymentStatus}
                          </span>
                        </TableCell>
                      </motion.tr>
                    )
                  })}
                </TableBody>
              </Table>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
