'use client'

import { useAuth } from '@/providers/Auth'
import { useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import { useEffect } from 'react'

export function EcommerceAuthSync() {
  const { status } = useAuth()
  const { onLogin, onLogout } = useEcommerce()

  useEffect(() => {
    if (status === 'loggedIn') {
      void onLogin()
    } else if (status === 'loggedOut') {
      onLogout()
    }
  }, [onLogin, onLogout, status])

  return null
}
