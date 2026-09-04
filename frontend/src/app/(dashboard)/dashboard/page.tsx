'use client'

import { useDashboardStats } from '@/lib/hooks/useReports'
import { useInvoices } from '@/lib/hooks/useInvoices'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  AlertTriangle,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Clock,
  MoreHorizontal,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts'
import { motion } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollAnimate, StaggerChildren, StaggerItem } from '@/components/animations'
import { staggerFadeIn, card3DTilt } from '@/lib/animations'

const formatCompact = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value}`
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: invoices, isLoading: invoicesLoading } = useInvoices()

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const data = stats || {
    todaySales: 0,
    todayPurchases: 0,
    todayRevenue: 0,
    todayProfit: 0,
    totalOrders: 0,
    inventoryValue: 0,
    lowStockCount: 0,
    expiryCount: 0,
    monthlySales: [],
    topProducts: [],
  }

  const recentInvoices = invoices?.data?.slice(0, 8) || []

  type InvoiceRow = {
    id: string
    customer?: { name?: string }
    invoiceDate?: string
    totalAmount?: number | string
    paymentStatus?: string
  }

  const kpiCards = [
    {
      title: "Today's Sales",
      value: formatCurrency(data.todaySales),
      icon: DollarSign,
      color: 'bg-pink',
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: "Today's Purchases",
      value: formatCurrency(data.todayPurchases),
      icon: ShoppingCart,
      color: 'bg-yellow',
      trend: { value: 3.2, isPositive: false },
    },
    {
      title: 'Total Orders',
      value: String(data.totalOrders),
      icon: Package,
      color: 'bg-blue',
      trend: { value: 8.1, isPositive: true },
    },
    {
      title: 'Inventory Value',
      value: formatCurrency(data.inventoryValue),
      icon: BarChart3,
      color: 'bg-purple',
      trend: { value: 5.4, isPositive: true },
    },
    {
      title: 'Low Stock Alerts',
      value: String(data.lowStockCount),
      icon: AlertTriangle,
      color: 'bg-green',
      trend: { value: 2.1, isPositive: false },
    },
    {
      title: "Today's Profit",
      value: formatCurrency(data.todayProfit),
      icon: TrendingUp,
      color: 'bg-pink',
      trend: { value: 15.3, isPositive: true },
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green'
      case 'pending':
        return 'bg-yellow'
      case 'draft':
        return 'bg-blue'
      case 'overdue':
        return 'bg-pink'
      default:
        return 'bg-muted'
    }
  }

  const getStatusTextColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-green'
      case 'pending':
        return 'text-yellow'
      case 'draft':
        return 'text-blue'
      case 'overdue':
        return 'text-pink'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <ScrollAnimate>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#222222]">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s what&apos;s happening with your business.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border border-border shadow-soft">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{formatDate(new Date())}</span>
            </div>
          </div>
        </div>
      </ScrollAnimate>

      {/* KPI Cards Grid */}
      <ScrollAnimate>
        <StaggerChildren className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
          {kpiCards.map((stat) => (
            <StaggerItem key={stat.title}>
              <motion.div
                className="border-0 shadow-card rounded-[24px] overflow-hidden card-hover group cursor-default"
                whileHover={card3DTilt}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-semibold text-foreground tracking-tight">{stat.value}</p>
                      {stat.trend && (
                        <div className="flex items-center gap-1">
                          {stat.trend.isPositive ? (
                            <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                          )}
                          <span className={`text-xs font-medium ${stat.trend.isPositive ? 'text-green-600' : 'text-red-500'}`}>
                            {Math.abs(stat.trend.value)}%
                          </span>
                          <span className="text-xs text-muted-foreground">vs last month</span>
                        </div>
                      )}
                    </div>
                    <div className={`p-3.5 rounded-2xl ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                      <stat.icon className="h-5 w-5 text-gray-800" />
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </ScrollAnimate>

      {/* Analytics Chart Section */}
      <ScrollAnimate>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-0 shadow-card rounded-[24px]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">Revenue Analytics</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">Monthly revenue overview for the year</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink/20">
                    <div className="w-2 h-2 rounded-full bg-pink" />
                    <span className="text-xs font-medium text-gray-800">Revenue</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlySales}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#121212" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#121212" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#6b6b6b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#D8CCB8' }}
                  />
                  <YAxis
                    stroke="#6b6b6b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#D8CCB8' }}
                    tickFormatter={formatCompact}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFF9F0',
                      border: '1px solid #D8CCB8',
                      borderRadius: '16px',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
                      padding: '12px 16px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#121212"
                    strokeWidth={3}
                    fill="url(#colorSales)"
                    dot={{ fill: '#121212', strokeWidth: 3, r: 5, stroke: '#FFF9F0' }}
                    activeDot={{ r: 7, strokeWidth: 3, stroke: '#FFF9F0' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="border-0 shadow-card rounded-[24px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Top Products</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Best performing products</p>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#6b6b6b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#D8CCB8' }}
                    tickFormatter={formatCompact}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#6b6b6b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#D8CCB8' }}
                    width={90}
                    tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFF9F0',
                      border: '1px solid #D8CCB8',
                      borderRadius: '16px',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#121212"
                    radius={[0, 12, 12, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          </Card>
        </div>
      </ScrollAnimate>

      {/* Recent Transactions Table */}
      <ScrollAnimate>
        <Card className="border-0 shadow-card rounded-[24px]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Recent Transactions</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Latest invoices and payments</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue/20">
                  <div className="w-2 h-2 rounded-full bg-blue" />
                  <span className="text-xs font-medium text-gray-800">{recentInvoices.length} Records</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={5} className="text-center py-12 text-[#9CA3AF]">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-border" />
                        <p>No transactions found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentInvoices.map((invoice: InvoiceRow) => (
                    <TableRow key={invoice.id} className="hover:bg-secondary/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0">
                            <FileText className="h-4 w-4 text-foreground" />
                          </div>
                          <span className="font-medium text-sm text-foreground break-anywhere">
                            #{String(invoice.id).slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground font-medium break-anywhere">
                          {invoice.customer?.name || 'Walk-in Customer'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-sm break-anywhere">{formatDate(invoice.invoiceDate as string)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-foreground break-anywhere">
                          {formatCurrency(Number(invoice.totalAmount))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.paymentStatus as string)} ${getStatusTextColor(invoice.paymentStatus as string)} break-anywhere`}>
                          {invoice.paymentStatus as string}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </ScrollAnimate>
    </div>
  )
}