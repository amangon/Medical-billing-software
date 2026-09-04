'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function usePurchases() {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/purchases')
        return { data: data.purchases || [] }
      } catch (error) {
        console.error('Failed to fetch purchases:', error)
        return { data: [] }
      }
    },
  })
}
