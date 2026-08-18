'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'react-hot-toast'
import { Moon, Sun, Save, Upload, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'

const emptyBusiness = {
  name: '',
  email: '',
  phone: '',
  gstin: '',
  pan: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  logo: '',
  signature: '',
  invoicePrefix: 'INV',
  currency: 'INR',
  cgstRate: 9,
  sgstRate: 9,
  igstRate: 18,
  upiId: '',
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  termsConditions: '',
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [business, setBusiness] = useState(emptyBusiness)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings')
      return data
    },
  })

  useEffect(() => {
    if (data?.business) {
      const b = {
        name: data.business.name ?? emptyBusiness.name,
        email: data.business.email ?? emptyBusiness.email,
        phone: data.business.phone ?? emptyBusiness.phone,
        gstin: data.business.gstin ?? emptyBusiness.gstin,
        pan: data.business.pan ?? emptyBusiness.pan,
        address: data.business.address ?? emptyBusiness.address,
        city: data.business.city ?? emptyBusiness.city,
        state: data.business.state ?? emptyBusiness.state,
        pincode: data.business.pincode ?? emptyBusiness.pincode,
        logo: data.business.logo ?? emptyBusiness.logo,
        signature: data.business.signature ?? emptyBusiness.signature,
        invoicePrefix: data.business.invoicePrefix ?? emptyBusiness.invoicePrefix,
        currency: data.business.currency ?? emptyBusiness.currency,
        cgstRate: data.business.cgstRate ?? emptyBusiness.cgstRate,
        sgstRate: data.business.sgstRate ?? emptyBusiness.sgstRate,
        igstRate: data.business.igstRate ?? emptyBusiness.igstRate,
        upiId: data.business.upiId ?? emptyBusiness.upiId,
        accountHolderName: data.business.accountHolderName ?? emptyBusiness.accountHolderName,
        bankName: data.business.bankName ?? emptyBusiness.bankName,
        accountNumber: data.business.accountNumber ?? emptyBusiness.accountNumber,
        ifscCode: data.business.ifscCode ?? emptyBusiness.ifscCode,
        termsConditions: data.business.termsConditions ?? emptyBusiness.termsConditions,
      }
      setBusiness(b)
      setLogoPreview(b.logo || null)
      setSignaturePreview(b.signature || null)
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.put('/settings', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings saved successfully')
    },
    onError: () => {
      toast.error('Failed to save settings')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!file) {
        throw new Error('Please select an image')
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPG, PNG, and WEBP images are allowed')
      }

      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/upload/image', formData)
      if (!data?.url) {
        throw new Error(data?.message || 'Image upload failed')
      }
      return data.url as string
    },
  })

  const validate = () => {
    if (!business.name.trim()) {
      toast.error('Business name is required')
      return false
    }
    if (!business.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(business.email)) {
      toast.error('Valid email is required')
      return false
    }
    if (!business.phone.trim() || business.phone.length < 10) {
      toast.error('Valid phone number is required')
      return false
    }
    if (business.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(business.gstin)) {
      toast.error('Invalid GSTIN format')
      return false
    }
    if (business.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(business.pan)) {
      toast.error('Invalid PAN format')
      return false
    }
    if (business.accountNumber && !/^[0-9]{9,18}$/.test(business.accountNumber.replace(/\s/g, ''))) {
      toast.error('Invalid account number')
      return false
    }
    if (business.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(business.ifscCode)) {
      toast.error('Invalid IFSC code')
      return false
    }
    return true
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await updateMutation.mutateAsync({ business })
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (file: File, type: 'logo' | 'signature') => {
    try {
      const url = await uploadMutation.mutateAsync(file)
      setBusiness((prev) => ({ ...prev, [type]: url }))
      if (type === 'logo') setLogoPreview(url)
      if (type === 'signature') setSignaturePreview(url)
      toast.success(`${type === 'logo' ? 'Logo' : 'Signature'} uploaded`)
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? 'Failed to upload file'
      toast.error(message)
    }
  }

  const handleRemoveFile = (type: 'logo' | 'signature') => {
    setBusiness((prev) => ({ ...prev, [type]: '' }))
    if (type === 'logo') setLogoPreview(null)
    if (type === 'signature') setSignaturePreview(null)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your business profile and preferences</p>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="banking">Banking</TabsTrigger>
          <TabsTrigger value="printer">Printer</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business Name *</Label>
                    <Input value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>GSTIN</Label>
                    <Input value={business.gstin} onChange={(e) => setBusiness({ ...business, gstin: e.target.value.toUpperCase() })} placeholder="27AABCU9603R1ZX" />
                  </div>
                  <div className="space-y-2">
                    <Label>PAN</Label>
                    <Input value={business.pan} onChange={(e) => setBusiness({ ...business, pan: e.target.value.toUpperCase() })} placeholder="AABCU9603R" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Input value={business.address} onChange={(e) => setBusiness({ ...business, address: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={business.city} onChange={(e) => setBusiness({ ...business, city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input value={business.state} onChange={(e) => setBusiness({ ...business, state: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>PIN Code</Label>
                    <Input value={business.pincode} onChange={(e) => setBusiness({ ...business, pincode: e.target.value })} />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-3">
                      {logoPreview ? (
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                          <Image src={logoPreview} alt="Logo" fill className="object-contain" />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                          No logo
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                          <div className={`flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted/50 ${uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Upload className="h-4 w-4" />
                            {logoPreview ? 'Change' : 'Upload'}
                          </div>
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadMutation.isPending}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(file, 'logo')
                            }}
                          />
                        </Label>
                        {logoPreview && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFile('logo')} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Signature</Label>
                    <div className="flex items-center gap-3">
                      {signaturePreview ? (
                        <div className="relative h-16 w-32 overflow-hidden rounded-lg border border-border">
                          <Image src={signaturePreview} alt="Signature" fill className="object-contain" />
                        </div>
                      ) : (
                        <div className="h-16 w-32 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                          No signature
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="signature-upload" className="cursor-pointer">
                          <div className={`flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted/50 ${uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Upload className="h-4 w-4" />
                            {signaturePreview ? 'Change' : 'Upload'}
                          </div>
                          <input
                            id="signature-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadMutation.isPending}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(file, 'signature')
                            }}
                          />
                        </Label>
                        {signaturePreview && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFile('signature')} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving || updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice Prefix</Label>
                    <Input value={business.invoicePrefix} onChange={(e) => setBusiness({ ...business, invoicePrefix: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input value={business.currency} onChange={(e) => setBusiness({ ...business, currency: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>CGST Rate (%)</Label>
                    <Input type="number" value={business.cgstRate} onChange={(e) => setBusiness({ ...business, cgstRate: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>SGST Rate (%)</Label>
                    <Input type="number" value={business.sgstRate} onChange={(e) => setBusiness({ ...business, sgstRate: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>IGST Rate (%)</Label>
                    <Input type="number" value={business.igstRate} onChange={(e) => setBusiness({ ...business, igstRate: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    value={business.termsConditions}
                    onChange={(e) => setBusiness({ ...business, termsConditions: e.target.value })}
                    placeholder="Enter standard terms and conditions for invoices"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving || updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking">
          <Card>
            <CardHeader>
              <CardTitle>Banking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <Input value={business.upiId} onChange={(e) => setBusiness({ ...business, upiId: e.target.value })} placeholder="example@upi" />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Holder Name</Label>
                    <Input value={business.accountHolderName} onChange={(e) => setBusiness({ ...business, accountHolderName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input value={business.bankName} onChange={(e) => setBusiness({ ...business, bankName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input value={business.accountNumber} onChange={(e) => setBusiness({ ...business, accountNumber: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input value={business.ifscCode} onChange={(e) => setBusiness({ ...business, ifscCode: e.target.value.toUpperCase() })} placeholder="SBIN0001234" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving || updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printer">
          <Card>
            <CardHeader>
              <CardTitle>Printer Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Printer</Label>
                  <p className="text-sm text-muted-foreground">Auto-print invoices and receipts</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Print</Label>
                  <p className="text-sm text-muted-foreground">Automatically print after order</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when stock is low</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Expiry Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified about expiring products</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">Remind customers about pending payments</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Toggle dark mode</p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
