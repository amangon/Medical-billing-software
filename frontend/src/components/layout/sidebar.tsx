'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  ShoppingBag,
  Users,
  Truck,
  Warehouse,
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  UserCog,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { toast } from 'react-hot-toast'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { motion, AnimatePresence } from 'framer-motion'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Orders', href: '/orders', icon: ClipboardList },
  { name: 'Purchases', href: '/purchases', icon: ShoppingBag },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Inventory', href: '/inventory', icon: Warehouse },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Notifications', href: '/notifications', icon: Bell },
]

const settingsNav = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Users', href: '/users', icon: UserCog },
]

const sidebarWidth = 288

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { isOpen, toggle, isMobile, setMobile } = useSidebarStore()

  useEffect(() => {
    const checkMobile = () => {
      setMobile(window.matchMedia('(max-width: 768px)').matches)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setMobile])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  const navContent = (
    <div className="flex flex-col h-full bg-[#1F1F1F]">
      <div className="p-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <LayoutDashboard className="h-5 w-5 text-[#1F1F1F]" />
          </div>
          <motion.span
            className="text-xl font-semibold text-white tracking-tight"
            layout
          >
            MyBill
          </motion.span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 mx-4 rounded-2xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white text-[#111827] shadow-lg'
                  : 'text-[#D1D5DB] hover:text-white hover:bg-white/10'
              )}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="flex-shrink-0"
              >
                <item.icon className="h-5 w-5" />
              </motion.div>
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
        <div className="pt-4 mt-4 border-t border-white/10 space-y-1 px-2">
          {settingsNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 mx-4 rounded-2xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white text-[#111827] shadow-lg'
                    : 'text-[#D1D5DB] hover:text-white hover:bg-white/10'
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="flex-shrink-0"
                >
                  <item.icon className="h-5 w-5" />
                </motion.div>
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      <div className="p-4 border-t border-white/10">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-[#D1D5DB] hover:text-white hover:bg-white/10 rounded-2xl"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </motion.div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={toggle}>
        <SheetContent side="left" className="p-0 w-[288px] bg-[#1F1F1F] border-r border-white/10">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ x: -sidebarWidth, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -sidebarWidth, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full"
              >
                {navContent}
              </motion.div>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <motion.aside
      className="fixed inset-y-0 left-0 z-30 w-[288px] bg-[#1F1F1F] shadow-xl"
      initial={false}
      animate={{ x: isOpen ? 0 : -sidebarWidth }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {navContent}
    </motion.aside>
  )
}
