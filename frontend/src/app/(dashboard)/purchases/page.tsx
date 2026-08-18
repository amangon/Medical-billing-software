'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function PurchasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#222222]">Purchases</h1>
          <p className="text-[#6B7280]">Manage supplier purchases</p>
        </div>
        <Button className="rounded-[24px]">
          <Plus className="mr-2 h-4 w-4" />
          New Purchase
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input placeholder="Search purchases..." className="pl-9 bg-[#F8F3EA] border-0 rounded-[24px]" />
            </div>
            <Button variant="outline" size="icon" className="rounded-[24px]">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-[#9CA3AF]">
            <ShoppingBag className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm">No purchases yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
