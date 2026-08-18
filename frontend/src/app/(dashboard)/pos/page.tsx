'use client'

import { Card, CardContent } from '@/components/ui/card'
import { POSProductGrid } from '@/components/pos/pos-product-grid'
import { POSCart } from '@/components/pos/pos-cart'
import { motion } from 'framer-motion'

export default function POSPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-[#222222]">Point of Sale</h1>
        <p className="text-[#6B7280]">Select products and manage cart items</p>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-h-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-full"
          >
            <Card className="h-full">
              <CardContent className="p-4 h-full overflow-y-auto">
                <POSProductGrid />
              </CardContent>
            </Card>
          </motion.div>
        </div>
        <div className="w-full lg:w-96 min-h-0">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-full"
          >
            <Card className="h-full">
              <CardContent className="p-4 h-full overflow-y-auto">
                <POSCart />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
