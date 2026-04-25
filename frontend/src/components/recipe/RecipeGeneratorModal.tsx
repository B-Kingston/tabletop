import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { useCreateRecipe } from '@/hooks/useRecipes'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'

interface RecipeGeneratorModalProps {
  open: boolean
  onClose: () => void
  instanceId: string
}

interface GeneratedRecipe {
  title: string
  description: string
  ingredients: { name: string; quantity: string; unit: string }[]
  steps: { content: string; durationMin: number | null }[]
  tags: string[]
}

export function RecipeGeneratorModal({ open, onClose, instanceId }: RecipeGeneratorModalProps) {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<GeneratedRecipe | null>(null)
  const [error, setError] = useState('')
  const createRecipe = useCreateRecipe(instanceId)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return

    setGenerating(true)
    setError('')
    setGenerated(null)

    try {
      const { data } = await api.post<{ data: GeneratedRecipe }>(
        `/instances/${instanceId}/recipes/generate`,
        { prompt }
      )
      setGenerated(data.data)
    } catch {
      setError('Failed to generate recipe. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function handleSave() {
    if (!generated) return

    createRecipe.mutate(
      {
        title: generated.title,
        description: generated.description,
        ingredients: generated.ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
        })),
        steps: generated.steps.map((s, i) => ({
          orderIndex: i + 1,
          content: s.content,
          durationMin: s.durationMin,
        })),
        tags: generated.tags,
      },
      {
        onSuccess: () => {
          onClose()
          setGenerated(null)
          setPrompt('')
        },
      }
    )
  }

  function handleClose() {
    onClose()
    setGenerated(null)
    setPrompt('')
    setError('')
  }

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI Recipe Generator
          </span>
        </DialogTitle>
      </DialogHeader>
      <DialogBody>
        {!generated ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="ai-prompt" className="block text-sm font-medium text-neutral-700 mb-1">
                What would you like to cook?
              </label>
              <textarea
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A quick pasta dish with whatever's in the fridge, something Thai-inspired with chicken..."
                rows={3}
                className="block w-full rounded-lg border-0 py-2.5 px-3 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-200 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-neutral-900 sm:text-sm resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {generating && (
              <div className="flex items-center justify-center gap-2 py-8 text-neutral-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Generating your recipe...</span>
              </div>
            )}

            <Button type="submit" disabled={!prompt.trim() || generating} className="w-full">
              {generating ? 'Generating...' : 'Generate Recipe'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{generated.title}</h3>
              {generated.description && (
                <p className="mt-1 text-sm text-neutral-600">{generated.description}</p>
              )}
            </div>

            {generated.ingredients.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Ingredients</h4>
                <ul className="space-y-1">
                  {generated.ingredients.map((ing, i) => (
                    <li key={i} className="text-sm text-neutral-600">
                      {ing.quantity} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {generated.steps.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Steps</h4>
                <ol className="space-y-2">
                  {generated.steps.map((s, i) => (
                    <li key={i} className="text-sm text-neutral-600">
                      <span className="font-medium text-neutral-900">{i + 1}.</span> {s.content}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {generated.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {generated.tags.map((tag) => (
                  <span key={tag} className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogBody>
      {generated && (
        <DialogFooter>
          <Button variant="secondary" onClick={() => setGenerated(null)}>
            Try Again
          </Button>
          <Button onClick={handleSave} disabled={createRecipe.isPending}>
            {createRecipe.isPending ? 'Saving...' : 'Save Recipe'}
          </Button>
        </DialogFooter>
      )}
    </Dialog>
  )
}
