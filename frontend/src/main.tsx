import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@/lib/clerk'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { setAuthTokenGetter } from './lib/api'
import { useAuth } from './hooks/useAuth'
import { queryClient } from './lib/queryClient'
import { router } from './router'
import './index.css'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const devSkipAuth = import.meta.env.VITE_DEV_SKIP_AUTH === 'true'

if (!clerkPubKey && !devSkipAuth) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

// Dev mode: set token synchronously before React mounts so first requests work
if (devSkipAuth) {
  setAuthTokenGetter(async () => 'dev')
}

function AuthSetup({ children }: { children: React.ReactNode }) {
  // Triggers token getter registration + auto user sync via useEffect
  useAuth()
  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <AuthSetup>
          <RouterProvider router={router} />
        </AuthSetup>
      </QueryClientProvider>
    </ClerkProvider>
  </React.StrictMode>,
)
