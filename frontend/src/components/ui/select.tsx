'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
  label?: string
  setLabel?: (label: string) => void
  open?: boolean
  setOpen?: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue>({})

const Select = ({
  value,
  defaultValue,
  onValueChange,
  children,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}) => {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue)
  const [label, setLabel] = React.useState<string | undefined>(undefined)
  const currentValue = value ?? internalValue

  const handleChange = (newValue: string, newLabel?: string) => {
    setInternalValue(newValue)
    if (newLabel !== undefined) setLabel(newLabel)
    onValueChange?.(newValue)
  }

  return (
    <SelectContext.Provider value={{ value: currentValue, onValueChange: handleChange, label, setLabel, open, setOpen }}>
      <div className="relative inline-block w-full" onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext)
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen?.(!open)}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-[20px] border border-border bg-white px-4 py-2.5 text-sm text-foreground ring-offset-background placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      aria-expanded={open}
      aria-haspopup="listbox"
      data-select-trigger
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
  }
)
SelectTrigger.displayName = 'SelectTrigger'

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value, label } = React.useContext(SelectContext)
  const displayText = label || value
  return (
    <span className="block w-full overflow-hidden text-overflow-ellipsis whitespace-nowrap">
      {displayText || placeholder}
    </span>
  )
}

const SelectContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { open, setOpen } = React.useContext(SelectContext)

  React.useEffect(() => {
    if (!open) return

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Element
      if (
        !target.closest('[data-select-content]') &&
        !target.closest('[data-select-trigger]')
      ) {
        setOpen?.(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      data-select-content
      className={cn(
        'absolute z-60 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-white text-foreground shadow-xl',
        className
      )}
    >
      {children}
    </div>
  )
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
}

const SelectItem = ({ value, children, disabled }: SelectItemProps) => {
  const { value: selectedValue, onValueChange, setLabel, setOpen } = React.useContext(SelectContext)
  const isSelected = selectedValue === value

  const handleSelect = () => {
    if (disabled) return
    const labelText = typeof children === 'string' ? children : ''
    onValueChange?.(value)
    setLabel?.(labelText)
    setOpen?.(false)
  }

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={handleSelect}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground font-medium',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span className="block w-full overflow-hidden text-overflow-ellipsis whitespace-nowrap">
        {children}
      </span>
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
