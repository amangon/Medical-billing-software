'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${orderId}`)
      return data.data
    },
    enabled: !!orderId,
  })
}