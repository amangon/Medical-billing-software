'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isOpen, isMobile } = useSidebarStore()

  return (
    <div className="min-h-screen bg-[#F8F3EA]">
      <Sidebar />
      <motion.div
        className={cn(
          'transition-all duration-300 ease-in-out min-h-screen flex flex-col',
          isOpen && !isMobile ? 'md:ml-[288px]' : 'md:ml-0'
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Header />
        <main className="flex-1 overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </motion.div>
    </div>
  )
}
