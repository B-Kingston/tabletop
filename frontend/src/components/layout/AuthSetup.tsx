import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { setAuthTokenGetter } from '@/lib/api'

export function AuthSetup({ children }: { children: React.ReactNode }) {
  const auth = useAuth()

  if (auth.isSignedIn) {
    setAuthTokenGetter(auth.getToken)
  } else if (auth.isLoaded) {
    setAuthTokenGetter(async () => null)
  }

  if (!auth.isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-10 w-10 animate-pulse rounded-full bg-border" />
      </div>
    )
  }

  return <>{children}</>
}
