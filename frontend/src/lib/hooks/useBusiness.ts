'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useBusiness() {
  return useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const { data } = await api.get('/business')
      return data
    },
  })
}