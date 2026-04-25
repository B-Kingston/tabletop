import React from 'react'
import {
  ClerkProvider as RealClerkProvider,
  useAuth as useRealAuth,
  SignedIn as RealSignedIn,
  SignedOut as RealSignedOut,
  SignInButton as RealSignInButton,
  UserButton as RealUserButton,
  SignIn as RealSignIn,
} from '@clerk/clerk-react'

const DEV_SKIP_AUTH = import.meta.env.VITE_DEV_SKIP_AUTH === 'true'

// ─── Dev mocks ───

const DevClerkProvider: React.FC<{ children: React.ReactNode; publishableKey?: string }> = ({
  children,
}) => <>{children}</>

function useDevAuth() {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: 'dev-user',
    sessionId: 'dev-session',
    actor: null,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    has: () => false,
    signOut: async () => {
      window.location.reload()
    },
    getToken: async () => 'dev',
  }
}

const DevSignedIn: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
)

const DevSignedOut: React.FC<{ children: React.ReactNode }> = () => null

const DevSignInButton: React.FC<{ children: React.ReactNode; mode?: string }> = ({
  children,
}) => <>{children}</>

const DevUserButton: React.FC<{ afterSignOutUrl?: string }> = () => (
  <div
    className="h-8 w-8 rounded-full bg-neutral-300 flex items-center justify-center text-xs font-medium text-neutral-600"
    title="Dev User"
  >
    D
  </div>
)

const DevSignIn: React.FC = () => (
  <div className="p-8 text-center text-neutral-600">Dev mode — you are already signed in</div>
)

// ─── Exports ───

export const ClerkProvider: typeof RealClerkProvider = DEV_SKIP_AUTH
  ? (DevClerkProvider as any)
  : RealClerkProvider

export const useAuth: typeof useRealAuth = DEV_SKIP_AUTH
  ? (useDevAuth as any)
  : useRealAuth

export const SignedIn: typeof RealSignedIn = DEV_SKIP_AUTH
  ? (DevSignedIn as any)
  : RealSignedIn

export const SignedOut: typeof RealSignedOut = DEV_SKIP_AUTH
  ? (DevSignedOut as any)
  : RealSignedOut

export const SignInButton: typeof RealSignInButton = DEV_SKIP_AUTH
  ? (DevSignInButton as any)
  : RealSignInButton

export const UserButton: typeof RealUserButton = DEV_SKIP_AUTH
  ? (DevUserButton as any)
  : RealUserButton

export const SignIn: typeof RealSignIn = DEV_SKIP_AUTH
  ? (DevSignIn as any)
  : RealSignIn
