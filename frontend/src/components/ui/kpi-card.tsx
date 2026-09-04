import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'pink' | 'yellow' | 'blue' | 'purple' | 'green'
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

const colorClasses = {
  pink: 'bg-pink',
  yellow: 'bg-yellow',
  blue: 'bg-blue',
  purple: 'bg-purple',
  green: 'bg-green',
}

const colorNameClasses = {
  pink: 'bg-pink text-gray-800',
  yellow: 'bg-yellow text-gray-800',
  blue: 'bg-blue text-gray-800',
  purple: 'bg-purple text-gray-800',
  green: 'bg-green text-gray-800',
}

export function KPICard({ title, value, icon: Icon, color, trend, className }: KPICardProps) {
  return (
    <Card className={cn('border-0 shadow-soft rounded-3xl overflow-hidden card-hover', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground break-anywhere">{title}</p>
            <p className="text-2xl font-semibold text-foreground break-anywhere">{value}</p>
            {trend && (
              <p className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-2xl transition-transform duration-300', colorNameClasses[color])}>
            <Icon className="h-5 w-5 text-gray-800" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
