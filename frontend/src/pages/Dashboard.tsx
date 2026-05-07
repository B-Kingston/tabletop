import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@/lib/clerk'
import { motion } from 'framer-motion'
import { Plus, LogIn, Users, Film, ChefHat, Wine, Moon } from 'lucide-react'
import { useInstances, useCreateInstance, useJoinInstance } from '@/hooks/useInstances'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { GridSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export function Dashboard() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
    <div className="flex items-center justify-between mb-10">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-accent-surface flex items-center justify-center">
          <span className="text-accent font-bold text-sm">T</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-text">Tabletop</h1>
      </div>
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
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center justify-center min-h-[55vh] space-y-10"
    >
      <div className="text-center space-y-5 max-w-xl">
        <p className="text-sm font-medium text-accent uppercase tracking-widest">Shared living</p>
        <h2 className="text-5xl font-bold tracking-tight text-text sm:text-6xl leading-[1.1]">
          A home for<br />small moments
        </h2>
        <p className="text-lg text-text-secondary leading-relaxed">
          Track the movies, recipes, wines, and evenings you share with the people you live with.
        </p>
      </div>
      <SignInButton mode="modal">
        <Button size="lg" className="shadow-glow">
          Get Started
        </Button>
      </SignInButton>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl mt-4">
        <FeaturePill icon={<Film className="h-4 w-4" />} label="Media" />
        <FeaturePill icon={<ChefHat className="h-4 w-4" />} label="Recipes" />
        <FeaturePill icon={<Wine className="h-4 w-4" />} label="Wines" />
        <FeaturePill icon={<Moon className="h-4 w-4" />} label="Nights" />
      </div>
    </motion.div>
  )
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-full bg-surface border border-border py-3 px-4 text-sm font-medium text-text-secondary">
      {icon}
      {label}
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
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text">Your spaces</h2>
          <p className="text-sm text-text-secondary mt-1">Where you share moments together</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setJoinOpen(true)}>
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Join</span>
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50/80 border border-red-100 p-4 text-sm text-red-700 mb-6">
          Failed to load spaces. Please try again.
        </div>
      )}

      {isLoading && <GridSkeleton count={3} />}

      {instances && instances.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-accent/10 blur-2xl" />
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-accent-surface text-accent">
              <Users className="h-9 w-9" strokeWidth={1.5} />
            </div>
          </div>
          <h3 className="text-2xl font-semibold tracking-tight text-text mb-2">No spaces yet</h3>
          <p className="text-text-secondary max-w-sm mb-10 leading-relaxed">
            Create a space to start tracking media, wines, and recipes with the people you share them with.
          </p>
          <div className="flex items-center gap-3">
            <Button size="lg" onClick={() => setCreateOpen(true)}>
              <Plus className="h-5 w-5" />
              Create Space
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setJoinOpen(true)}>
              <LogIn className="h-5 w-5" />
              Join Space
            </Button>
          </div>
        </motion.div>
      )}

      {instances && instances.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance, i) => (
            <InstanceCard key={instance.id} instance={instance} index={i} />
          ))}
        </div>
      )}

      <CreateInstanceDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinInstanceDialog open={joinOpen} onClose={() => setJoinOpen(false)} />
    </motion.div>
  )
}

function InstanceCard({ instance, index }: { instance: import('@/types/models').Instance; index: number }) {
  const navigate = useNavigate()

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => navigate({ to: '/instances/$instanceId/media', params: { instanceId: instance.id } })}
      className="soft-card-hover text-left w-full group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-2xl bg-surface-secondary flex items-center justify-center text-text-secondary group-hover:bg-accent-surface group-hover:text-accent transition-colors duration-150">
          <Users className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <span className="text-xs font-medium text-muted bg-surface-secondary rounded-full px-2.5 py-1">
          {instance.members?.length ?? 0} member{(instance.members?.length ?? 0) !== 1 ? 's' : ''}
        </span>
      </div>
      <h3 className="font-semibold text-text text-lg mb-1">{instance.name}</h3>
      {instance.owner && (
        <p className="text-sm text-text-secondary">
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
          <DialogTitle>Create a space</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-5">
            {errorMessage && (
              <div className="rounded-2xl bg-red-50/80 border border-red-100 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            <div>
              <label htmlFor="create-name" className="block text-sm font-medium text-text mb-2">
                Name
              </label>
              <Input
                id="create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., The Apartment"
                required
              />
            </div>
            <div>
              <label htmlFor="create-password" className="block text-sm font-medium text-text mb-2">
                Password
              </label>
              <Input
                id="create-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Members will need this to join"
                required
                minLength={4}
              />
              <p className="text-xs text-muted mt-2">Minimum 4 characters</p>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
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
          <DialogTitle>Join a space</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-5">
            {errorMessage && (
              <div className="rounded-2xl bg-red-50/80 border border-red-100 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            <div>
              <label htmlFor="join-id" className="block text-sm font-medium text-text mb-2">
                Space ID
              </label>
              <Input
                id="join-id"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                placeholder="Paste the space ID"
                required
              />
            </div>
            <div>
              <label htmlFor="join-password" className="block text-sm font-medium text-text mb-2">
                Password
              </label>
              <Input
                id="join-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the space password"
                required
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
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
