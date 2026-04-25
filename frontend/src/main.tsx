import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider, useAuth } from '@/lib/clerk'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { setAuthTokenGetter } from './lib/api'
import { queryClient } from './lib/queryClient'
import { router } from './router'
import './index.css'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const devSkipAuth = import.meta.env.VITE_DEV_SKIP_AUTH === 'true'

if (!clerkPubKey && !devSkipAuth) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

// Set dev token synchronously so the very first React Query request includes auth headers
if (devSkipAuth) {
  setAuthTokenGetter(async () => 'dev')
}

function AuthTokenSetup({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth()
  React.useEffect(() => {
    if (!devSkipAuth) {
      setAuthTokenGetter(getToken)
    }
  }, [getToken])
  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <AuthTokenSetup>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthTokenSetup>
    </ClerkProvider>
  </React.StrictMode>,
)
