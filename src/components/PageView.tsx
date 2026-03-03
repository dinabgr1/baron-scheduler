'use client'

import { useEffect } from 'react'

export default function PageView({ page }: { page: string }) {
  useEffect(() => {
    const nav = navigator as any
    const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection
    const connectionType = conn?.effectiveType || conn?.type || null

    fetch('/api/log-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login_type: 'view',
        user_name: page,
        screen_size: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        connection: connectionType,
      }),
    }).catch(() => {})
  }, [page])
  return null
}
