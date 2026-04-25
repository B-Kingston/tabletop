import { SignedIn, SignedOut, SignInButton, UserButton } from '@/lib/clerk'

export function AuthGate() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          Tabletop
        </h1>
        <p className="text-lg text-neutral-600 max-w-md mx-auto">
          Track media, wines, and recipes with the people you share them with.
        </p>
      </div>
      
      <SignedOut>
        <SignInButton mode="modal">
          <button className="btn-primary text-base px-8 py-3">
            Get Started
          </button>
        </SignInButton>
      </SignedOut>
      
      <SignedIn>
        <div className="flex items-center space-x-4">
          <span className="text-neutral-600">Welcome back</span>
          <UserButton afterSignOutUrl="/" />
        </div>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          <FeatureCard title="Media" description="Plan and review movies & shows" />
          <FeatureCard title="Wine" description="Rate and track your cellar" />
          <FeatureCard title="Recipes" description="Cook, share, and iterate" />
        </div>
      </SignedIn>
    </div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="card text-center space-y-2 hover:shadow-md transition-shadow cursor-pointer">
      <h3 className="font-semibold text-neutral-900">{title}</h3>
      <p className="text-sm text-neutral-600">{description}</p>
    </div>
  )
}