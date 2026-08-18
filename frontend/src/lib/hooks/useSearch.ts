'use client'

import { useMemo, useState, useEffect } from 'react'

export function useSearch<T>(items: T[], searchKey: keyof T) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const filtered = useMemo(() => {
    if (!debouncedQuery) return items
    const lower = debouncedQuery.toLowerCase()
    return items.filter((item) => {
      const value = item[searchKey]
      if (typeof value === 'string') return value.toLowerCase().includes(lower)
      if (typeof value === 'number') return String(value).includes(lower)
      return false
    })
  }, [items, searchKey, debouncedQuery])

  return { query, setQuery, filtered }
}
