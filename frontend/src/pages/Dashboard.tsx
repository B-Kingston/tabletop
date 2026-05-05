import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@/lib/clerk'
import { motion } from 'framer-motion'
import { Plus, LogIn, Users, Film, ChefHat, Wine } from 'lucide-react'
import { useInstances, useCreateInstance, useJoinInstance } from '@/hooks/useInstances'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { GridSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export function Dashboard() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <DashboardHeader />
          <SignedIn>
            <InstanceSection />
          </SignedIn>
          <SignedOut>
            <LandingSection />
          </SignedOut>
        </div>
      </div>
    </ErrorBoundary>
  )
}

function DashboardHeader() {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Tabletop</h1>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  )
}

function LandingSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
    >
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          Share your collection
        </h2>
        <p className="text-lg text-neutral-600 max-w-md mx-auto">
          Track media, wines, and recipes with the people you share them with.
        </p>
      </div>
      <SignInButton mode="modal">
        <Button size="lg">Get Started</Button>
      </SignInButton>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-8">
        <FeatureCard icon={<Film className="h-6 w-6" />} title="Media" description="Plan and review movies & shows" />
        <FeatureCard icon={<Wine className="h-6 w-6" />} title="Wine" description="Rate and track your cellar" />
        <FeatureCard icon={<ChefHat className="h-6 w-6" />} title="Recipes" description="Cook, share, and iterate" />
      </div>
    </motion.div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 text-center space-y-3 hover:shadow-md transition-shadow">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
        {icon}
      </div>
      <h3 className="font-semibold text-neutral-900">{title}</h3>
      <p className="text-sm text-neutral-600">{description}</p>
    </div>
  )
}

function InstanceSection() {
  const { data: instances, isLoading, error } = useInstances()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">Your Groups</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setJoinOpen(true)}>
            <LogIn className="mr-2 h-4 w-4" />
            Join
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 mb-4">
          Failed to load groups. Please try again.
        </div>
      )}

      {isLoading && <GridSkeleton count={3} />}

      {instances && instances.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-6">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">No groups yet</h3>
          <p className="text-neutral-600 max-w-sm mb-8">
            Create a group to start tracking media, wines, and recipes with friends.
          </p>
          <div className="flex items-center gap-3">
            <Button size="lg" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Create Group
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setJoinOpen(true)}>
              <LogIn className="mr-2 h-5 w-5" />
              Join Group
            </Button>
          </div>
        </motion.div>
      )}

      {instances && instances.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <InstanceCard key={instance.id} instance={instance} />
          ))}
        </div>
      )}

      <CreateInstanceDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinInstanceDialog open={joinOpen} onClose={() => setJoinOpen(false)} />
    </motion.div>
  )
}

function InstanceCard({ instance }: { instance: import('@/types/models').Instance }) {
  const navigate = useNavigate()

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => navigate({ to: '/instances/$instanceId/media', params: { instanceId: instance.id } })}
      className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 text-left hover:shadow-md transition-shadow w-full"
    >
      <h3 className="font-semibold text-neutral-900 mb-1">{instance.name}</h3>
      <p className="text-sm text-neutral-500">
        {instance.members?.length ?? 0} member{(instance.members?.length ?? 0) !== 1 ? 's' : ''}
      </p>
      {instance.owner && (
        <p className="text-xs text-neutral-400 mt-2">
          Created by {instance.owner.name}
        </p>
      )}
    </motion.button>
  )
}

function CreateInstanceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const createMutation = useCreateInstance()
  const navigate = useNavigate()

  const errorMessage =
    createMutation.error instanceof Error
      ? (createMutation.error as any)?.response?.data?.error ?? createMutation.error.message
      : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate(
      { name, password },
      {
        onSuccess: (instance) => {
          onClose()
          setName('')
          setPassword('')
          navigate({ to: '/instances/$instanceId/media', params: { instanceId: instance.id } })
        },
      }
    )
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            {errorMessage && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            <div>
              <label htmlFor="create-name" className="block text-sm font-medium text-neutral-700 mb-1">
                Name
              </label>
              <Input
                id="create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Friday Night Dinner Club"
                required
              />
            </div>
            <div>
              <label htmlFor="create-password" className="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <Input
                id="create-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Members will need this to join (min 4 characters)"
                required
                minLength={4}
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name || !password || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

function JoinInstanceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [instanceId, setInstanceId] = useState('')
  const [password, setPassword] = useState('')
  const joinMutation = useJoinInstance()
  const navigate = useNavigate()

  const errorMessage =
    joinMutation.error instanceof Error
      ? (joinMutation.error as any)?.response?.data?.error ?? joinMutation.error.message
      : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    joinMutation.mutate(
      { instanceId, password },
      {
        onSuccess: () => {
          onClose()
          setInstanceId('')
          setPassword('')
          navigate({ to: '/instances/$instanceId/media', params: { instanceId } })
        },
      }
    )
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Join Group</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            {errorMessage && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            <div>
              <label htmlFor="join-id" className="block text-sm font-medium text-neutral-700 mb-1">
                Group ID
              </label>
              <Input
                id="join-id"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                placeholder="Paste the group ID"
                required
              />
            </div>
            <div>
              <label htmlFor="join-password" className="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <Input
                id="join-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the group password"
                required
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!instanceId || !password || joinMutation.isPending}>
            {joinMutation.isPending ? 'Joining...' : 'Join'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
