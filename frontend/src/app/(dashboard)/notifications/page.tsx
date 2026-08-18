'use client'

import { useNotifications, useMarkAllAsRead } from '@/lib/hooks/useNotifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { Bell, CheckCheck } from 'lucide-react'
import { useUnreadCount } from '@/lib/hooks/useNotifications'

export default function NotificationsPage() {
  const { data: notifications, isLoading, refetch } = useNotifications()
  const { data: unreadCount } = useUnreadCount()
  const markAllAsRead = useMarkAllAsRead()

  const items = notifications?.data || notifications || []

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'LOW_STOCK': return 'bg-red-100 text-red-800'
      case 'EXPIRY': return 'bg-yellow-100 text-yellow-800'
      case 'PAYMENT_REMINDER': return 'bg-blue-100 text-blue-800'
      case 'ORDER': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount?.count || 0} unread notifications
          </p>
        </div>
        {unreadCount?.count > 0 && (
          <Button variant="outline" onClick={() => markAllAsRead.mutate()}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">Loading notifications...</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((notification: unknown) => {
                const n = notification as {
                  id: string
                  type: string
                  title: string
                  message: string
                  isRead: boolean
                  createdAt: string
                }
                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-lg border ${n.isRead ? 'bg-background' : 'bg-muted/50'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(n.type)}>{n.type}</Badge>
                          {!n.isRead && <div className="w-2 h-2 bg-primary rounded-full" />}
                        </div>
                        <h4 className="font-medium">{n.title}</h4>
                        <p className="text-sm text-muted-foreground">{n.message}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
