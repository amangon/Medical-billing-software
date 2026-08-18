'use client'

import { useAuth } from '@/lib/auth'
import { ThemeToggle } from '@/components/providers/theme-toggle'
import { Button } from '@/components/ui/button'
import { Bell, Menu, Search } from 'lucide-react'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import Link from 'next/link'
import { useUnreadCount } from '@/lib/hooks/useNotifications'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'

export function Header() {
  const { user } = useAuth()
  const { toggle } = useSidebarStore()
  const { data: unreadCount } = useUnreadCount()

  return (
    <motion.header
      className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-white/80 backdrop-blur-md px-4 md:px-6 flex-shrink-0"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden rounded-2xl h-10 w-10"
        onClick={toggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        <div className="relative max-w-full sm:max-w-md lg:max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input
            placeholder="Search anything..."
            className="pl-9 bg-[#F8F3EA] border-0 rounded-2xl focus:ring-2 focus:ring-primary/20 h-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative rounded-2xl h-10 w-10">
            <Bell className="h-5 w-5" />
            {unreadCount?.count > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </Button>
        </Link>
        <div className="hidden md:flex items-center gap-3 ml-2 pl-2 border-l border-border">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white font-medium text-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="text-sm min-w-0">
            <p className="font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
