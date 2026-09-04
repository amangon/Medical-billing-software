'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/reports/dashboard-stats')
        return data.data ?? {
          totalSales: 0,
          totalInvoices: 0,
          totalCustomers: 0,
          totalProducts: 0,
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        return {
          totalSales: 0,
          totalInvoices: 0,
          totalCustomers: 0,
          totalProducts: 0,
        }
      }
    },
    refetchInterval: 60000,
  })
}

export function useSalesReport(filters?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['reports', 'sales', filters],
    queryFn: async () => {
      try {
        const { data } = await api.get('/reports/sales', { params: filters })
        return data.data ?? []
      } catch (error) {
        console.error('Failed to fetch sales report:', error)
        return []
      }
    },
  })
}

export function useGSTReport(filters?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['reports', 'gst', filters],
    queryFn: async () => {
      try {
        const { data } = await api.get('/reports/gst', { params: filters })
        return data.data ?? []
      } catch (error) {
        console.error('Failed to fetch GST report:', error)
        return []
      }
    },
  })
}
