'use client'

import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'

export default function UsersPage() {
  const { user } = useAuth()

  const isAdmin = user?.role === 'ADMIN'

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to view this page</p>
      </div>
    )
  }

  const users = [
    { id: '1', name: 'Admin User', email: 'admin@mybill.com', role: 'ADMIN', isActive: true },
    { id: '2', name: 'Manager User', email: 'manager@mybill.com', role: 'MANAGER', isActive: true },
    { id: '3', name: 'Staff User', email: 'staff@mybill.com', role: 'STAFF', isActive: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage team members and permissions</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{u.name}</h4>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-2 py-1 bg-primary/10 rounded-full text-xs font-medium">
                    {u.role}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
