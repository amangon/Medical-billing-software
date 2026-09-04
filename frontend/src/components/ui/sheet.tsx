import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as ReactDOM from 'react-dom'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  side?: 'left' | 'right' | 'top' | 'bottom'
}

const Sheet = ({ open, onOpenChange, children, side = 'right' }: SheetProps) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-modal-backdrop bg-black/50"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={side === 'left' ? { x: '-100%' } : side === 'right' ? { x: '100%' } : side === 'top' ? { y: '-100%' } : { y: '100%' }}
            animate={side === 'left' || side === 'right' ? { x: 0 } : { y: 0 }}
            exit={side === 'left' ? { x: '-100%' } : side === 'right' ? { x: '100%' } : side === 'top' ? { y: '-100%' } : { y: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className={cn(
              'fixed z-modal bg-background shadow-2xl',
              side === 'right' && 'inset-y-0 right-0 w-80',
              side === 'left' && 'inset-y-0 left-0 w-80',
              side === 'top' && 'inset-x-0 top-0 h-80',
              side === 'bottom' && 'inset-x-0 bottom-0 h-80'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

const SheetContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { side?: 'left' | 'right' | 'top' | 'bottom' }>(
  ({ className, side, ...props }, ref) => (
    <div ref={ref} className={cn('h-full overflow-y-auto', className)} {...props} />
  )
)
SheetContent.displayName = 'SheetContent'

const SheetHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
  )
)
SheetHeader.displayName = 'SheetHeader'

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
  )
)
SheetTitle.displayName = 'SheetTitle'

export { Sheet, SheetContent, SheetHeader, SheetTitle }
