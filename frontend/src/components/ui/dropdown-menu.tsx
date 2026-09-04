import * as React from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  value?: string
  onValueChange?: (value: string) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  setOpen: () => {},
})

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block w-full">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  ({ asChild = false, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext)
    const handleClick = () => setOpen(!open)

    if (asChild && React.isValidElement(children)) {
      const childProps = (children as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>).props
      return React.cloneElement(children as React.ReactElement<React.ComponentPropsWithRef<'button'>>, {
        ref,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          handleClick()
          childProps.onClick?.(e)
        },
        'aria-expanded': open,
        ...props,
      })
    }
    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        {...props}
        onClick={(e) => {
          handleClick()
          props.onClick?.(e)
        }}
      >
        {children}
      </button>
    )
  }
)
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

const DropdownMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'center' | 'end' }>(
  ({ className, children, align = 'end', ...props }, ref) => {
    const { open } = React.useContext(DropdownMenuContext)

    if (!open) return null

    const alignClass = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0',
    }[align]

    return (
      <div
        ref={ref}
        data-select-content
        className={cn(
          'absolute z-60 mt-2 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl',
          alignClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }>(
  ({ asChild = false, children, className, ...props }, ref) => {
    const { setOpen } = React.useContext(DropdownMenuContext)

    const handleClick = () => setOpen(false)

    if (asChild && React.isValidElement(children)) {
      const childProps = (children as React.ReactElement<React.HTMLAttributes<HTMLDivElement>>).props
      return React.cloneElement(children as React.ReactElement<React.ComponentPropsWithRef<'div'>>, {
        className: cn(
          'relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
          childProps.className,
          className
        ),
        onClick: (e: React.MouseEvent<Element>) => {
          handleClick()
          childProps.onClick?.(e as React.MouseEvent<HTMLDivElement>)
        },
        ...props,
      })
    }
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
  )
)
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator }
