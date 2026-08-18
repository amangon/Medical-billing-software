import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'pill'
    | 'pillSecondary'
    | 'pillOutline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const buttonVariants = {
  default:
    'bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-[20px] px-6 py-2.5 font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95',
  destructive:
    'bg-destructive text-destructive-foreground rounded-[20px] px-6 py-2.5 font-medium transition-all duration-200 hover:bg-destructive/90',
  outline:
    'border border-border bg-transparent text-foreground rounded-[20px] px-6 py-2.5 font-medium transition-all duration-200 hover:bg-muted',
  secondary:
    'bg-secondary text-secondary-foreground rounded-[20px] px-6 py-2.5 font-medium transition-all duration-200 hover:bg-secondary/80',
  ghost:
    'text-foreground rounded-[20px] px-3 py-2 font-medium transition-all duration-200 hover:bg-muted hover:text-foreground',
  link: 'text-primary underline-offset-4 hover:underline rounded-[20px] px-3 py-2 font-medium',
  pill:
    'rounded-full bg-black text-white hover:bg-black/85 shadow-soft hover:shadow font-medium transition-all duration-200',
  pillSecondary:
    'rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-soft font-medium transition-all duration-200',
  pillOutline:
    'rounded-full border border-border bg-transparent text-foreground hover:bg-muted font-medium transition-all duration-200',
}

const buttonSizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-[16px] px-3',
  lg: 'h-11 rounded-[20px] px-8',
  icon: 'h-10 w-10 rounded-[20px]',
}

const baseStyles =
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

const Button = React.forwardRef<HTMLButtonElement, ButtonProps & { asChild?: boolean }>(
  ({ className, variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const variantClass = buttonVariants[variant]
    const sizeClass = variant === 'pill' || variant === 'pillSecondary' || variant === 'pillOutline'
      ? ''
      : buttonSizes[size]

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement
      return React.cloneElement(child, {
        ref,
        className: cn(baseStyles, variantClass, sizeClass, className, child.props.className),
        ...props,
      })
    }
    return (
      <button
        className={cn(baseStyles, variantClass, sizeClass, className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
