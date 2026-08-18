'use client'

import { useState } from 'react'
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
import { Download, FileText } from 'lucide-react'
import Link from 'next/link'

export default function ReportsPage() {
  const reports = [
    { name: 'Sales Report', href: '/reports/sales', icon: FileText, description: 'Detailed sales analytics' },
    { name: 'GST Report', href: '/reports/gst', icon: FileText, description: 'GST summary and returns' },
    { name: 'Profit & Loss', href: '/reports/profit-loss', icon: FileText, description: 'Financial performance' },
    { name: 'Inventory Report', href: '/reports/inventory', icon: FileText, description: 'Stock levels and valuation' },
    { name: 'Customer Report', href: '/reports/customers', icon: FileText, description: 'Customer analytics' },
    { name: 'Supplier Report', href: '/reports/suppliers', icon: FileText, description: 'Supplier analytics' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate and view business reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.name} href={report.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{report.name}</h3>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
