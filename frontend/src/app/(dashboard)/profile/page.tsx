'use client'

import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'

export default function ProfilePage() {
  const { user, logout } = useAuth()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Profile updated (demo)')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input id="profile-name" defaultValue={user?.name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" defaultValue={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input id="profile-phone" defaultValue={user?.phone || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-role">Role</Label>
                <Input id="profile-role" value={user?.role || ''} disabled />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit">Update Profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
