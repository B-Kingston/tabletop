import { useAuth } from '@clerk/clerk-react'
import { AppShell } from './components/layout/AppShell'
import { AuthGate } from './components/layout/AuthGate'

function App() {
  const { isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
      </div>
    )
  }

  return (
    <AppShell>
      <AuthGate />
    </AppShell>
  )
}

export default App