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
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200" />
      </div>
    )
  }

  return <>{children}</>
}
