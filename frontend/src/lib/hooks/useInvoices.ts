'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/invoices')
        return { data: data.invoices || [] }
      } catch (error) {
        console.error('Failed to fetch invoices:', error)
        return { data: [] }
      }
    },
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/invoices/${id}`)
        return data || {}
      } catch (error) {
        console.error('Failed to fetch invoice:', error)
        return {}
      }
    },
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: unknown) => {
      const { data: res } = await api.post('/invoices', data)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const { data: res } = await api.put(`/invoices/${id}`, data)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice'] })
    },
  })
}

export function useInvoicePDF(id: string) {
  return useQuery({
    queryKey: ['invoices', id, 'pdf'],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
        return data
      } catch (error) {
        console.error('Failed to fetch invoice PDF:', error)
        return null
      }
    },
    enabled: !!id,
  })
}
