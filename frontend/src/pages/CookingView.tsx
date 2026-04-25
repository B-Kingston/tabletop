import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Timer } from 'lucide-react'
import { useRecipe } from '@/hooks/useRecipes'
import { Button } from '@/components/ui/Button'
import { DetailSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import type { RecipeStep } from '@/types/models'

export function CookingView() {
  const { instanceId, recipeId } = useParams({ strict: false }) as { instanceId: string; recipeId: string }
  const navigate = useNavigate()
  const { data: recipe, isLoading, error } = useRecipe(instanceId, recipeId)
  const [currentStep, setCurrentStep] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const steps = recipe?.steps ?? []
  const step: RecipeStep | undefined = steps[currentStep]

  useEffect(() => {
    if (timerRunning && timerSeconds !== null && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          if (s === null || s <= 1) {
            setTimerRunning(false)
            if (intervalRef.current) clearInterval(intervalRef.current)
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerRunning, timerSeconds])

  useEffect(() => {
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        }
      } catch {}
    }
    requestWakeLock()
    return () => {
      wakeLockRef.current?.release()
    }
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        setCurrentStep((s) => Math.min(s + 1, steps.length - 1))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentStep((s) => Math.max(s - 1, 0))
      } else if (e.key === 'Escape') {
        navigate({ to: '/instances/$instanceId/recipes/$recipeId', params: { instanceId, recipeId } })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [steps.length, instanceId, recipeId, navigate])

  function startTimer(durationMin: number) {
    setTimerSeconds(durationMin * 60)
    setTimerRunning(true)
  }

  function toggleTimer() {
    if (timerRunning) {
      setTimerRunning(false)
    } else if (timerSeconds !== null && timerSeconds > 0) {
      setTimerRunning(true)
    }
  }

  function resetTimer() {
    setTimerRunning(false)
    setTimerSeconds(null)
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (isLoading) return <DetailSkeleton />

  if (error || !recipe) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Failed to load recipe.
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 z-50 bg-neutral-900 text-white flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h1 className="text-lg font-semibold truncate">{recipe.title}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={() =>
                navigate({
                  to: '/instances/$instanceId/recipes/$recipeId',
                  params: { instanceId, recipeId },
                })
              }
              className="rounded-sm p-1 text-neutral-400 hover:text-white transition-colors"
              aria-label="Exit cooking view"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className="cook-view mx-auto max-w-2xl"
            >
              {step ? (
                <div className="space-y-8">
                  {step.title && (
                    <h2 className="text-3xl font-bold text-white">{step.title}</h2>
                  )}
                  <p className="text-xl leading-relaxed text-neutral-200">{step.content}</p>

                  {step.durationMin && step.durationMin > 0 && (
                    <div className="mt-8 rounded-xl bg-neutral-800 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Timer className="h-6 w-6 text-neutral-400" />
                          <span className="text-sm text-neutral-400">Timer: {step.durationMin} min</span>
                        </div>
                        <div className="flex gap-2">
                          {timerSeconds === null ? (
                            <Button
                              variant="secondary"
                              onClick={() => startTimer(step.durationMin!)}
                            >
                              Start Timer
                            </Button>
                          ) : (
                            <>
                              <span className="text-3xl font-mono font-bold text-white">
                                {formatTime(timerSeconds)}
                              </span>
                              <Button variant="secondary" onClick={toggleTimer}>
                                {timerRunning ? 'Pause' : 'Resume'}
                              </Button>
                              <Button variant="ghost" onClick={resetTimer} className="text-neutral-400">
                                Reset
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 0 && recipe.ingredients && recipe.ingredients.length > 0 && (
                    <div className="mt-8 rounded-xl bg-neutral-800 p-6">
                      <h3 className="text-xl font-semibold mb-4 text-white">Ingredients</h3>
                      <ul className="space-y-2">
                        {recipe.ingredients.map((ing) => (
                          <li key={ing.id} className="flex items-center gap-3 text-lg text-neutral-300">
                            <span className="text-neutral-500">
                              {ing.quantity} {ing.unit}
                            </span>
                            <span>{ing.name}</span>
                            {ing.optional && (
                              <span className="text-xs text-neutral-500">(optional)</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <h2 className="text-3xl font-bold text-white mb-4">No steps defined</h2>
                  <p className="text-lg text-neutral-400">Add steps to this recipe to use the cooking view.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="flex items-center justify-between border-t border-neutral-800 px-6 py-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setCurrentStep((s) => Math.max(s - 1, 0))}
            disabled={currentStep === 0}
            className="text-neutral-400 hover:text-white"
          >
            <ChevronLeft className="mr-2 h-6 w-6" />
            Previous
          </Button>

          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === currentStep ? 'bg-white' : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => setCurrentStep((s) => Math.min(s + 1, steps.length - 1))}
            disabled={currentStep >= steps.length - 1}
            className="text-neutral-400 hover:text-white"
          >
            Next
            <ChevronRight className="ml-2 h-6 w-6" />
          </Button>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
