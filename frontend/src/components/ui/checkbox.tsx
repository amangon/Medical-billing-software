import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      disabled={disabled}
      className={cn(
        'peer h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-gray-900 text-primary-foreground' : 'bg-white',
        className
      )}
      ref={ref}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      {checked && <Check className="h-3 w-3 text-white" />}
    </button>
  )
})
Checkbox.displayName = 'Checkbox'

export { Checkbox }
