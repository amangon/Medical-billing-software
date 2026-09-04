'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' }>>([])

  const success = (message: string) => {
    toast.success(message)
  }

  const error = (message: string) => {
    toast.error(message)
  }

  return { success, error }
}
