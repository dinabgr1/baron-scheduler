'use client'

import { useEffect } from 'react'

export default function PageView({ page }: { page: string }) {
  useEffect(() => {
    fetch('/api/log-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_type: 'view', user_name: page }),
    }).catch(() => {})
  }, [page])
  return null
}
