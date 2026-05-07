import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { useCreateRecipe } from '@/hooks/useRecipes'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { getRecipeSourceLinks } from '@/lib/sourceUtils'

interface RecipeGeneratorModalProps {
  open: boolean
  onClose: () => void
  instanceId: string
}

interface GeneratedRecipeSource {
  title?: string
  url: string
}

interface GeneratedRecipe {
  title: string
  description: string
  prepTime: number
  cookTime: number
  servings: number
  sourceUrls?: string[]
  sources?: GeneratedRecipeSource[]
  ingredients: { name: string; quantity: string; unit: string; optional?: boolean }[]
  steps: { content: string; durationMin: number | null }[]
  tags: string[]
}

export function RecipeGeneratorModal({ open, onClose, instanceId }: RecipeGeneratorModalProps) {
  const [prompt, setPrompt] = useState('')
  const [simplicity, setSimplicity] = useState(3)
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
        { prompt, simplicity }
      )
      setGenerated(data.data)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 429) {
        setError('Daily AI limit reached. Try again tomorrow.')
      } else if (status === 502 || status === 503) {
        setError('AI service temporarily unavailable.')
      } else if (status === 422) {
        setError('AI returned an unexpected response. Please try again.')
      } else {
        setError('Failed to generate recipe. Please try again.')
      }
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
        prepTime: generated.prepTime,
        cookTime: generated.cookTime,
        servings: generated.servings,
        sourceUrl: generated.sourceUrls?.[0] ?? '',
        sourceUrls: sources.map((source) => source.url),
        ingredients: generated.ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          optional: i.optional,
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
          setSimplicity(3)
        },
      }
    )
  }

  function handleClose() {
    onClose()
    setGenerated(null)
    setPrompt('')
    setSimplicity(3)
    setError('')
  }

  const sources: GeneratedRecipeSource[] = generated
    ? generated.sources?.length
      ? generated.sources
      : (generated.sourceUrls?.map((url) => ({ url })) ?? [])
    : []
  const sourceLinks = getRecipeSourceLinks(sources.map((source) => source.url))
  const visibleSourceLinks = sourceLinks.slice(0, 6)
  const hiddenSourceCount = Math.max(sourceLinks.length - visibleSourceLinks.length, 0)

  return (
    <Dialog open={open} onClose={handleClose} className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden">
      <DialogHeader>
        <DialogTitle>
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Recipe Inspiration
          </span>
        </DialogTitle>
      </DialogHeader>
      <DialogBody>
        {!generated ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="ai-prompt" className="block text-sm font-medium text-text-secondary mb-1">
                What would you like to cook?
              </label>
              <textarea
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A quick pasta dish with whatever's in the fridge, something Thai-inspired with chicken..."
                rows={3}
                className="block w-full rounded-2xl bg-surface-secondary border-0 py-2.5 px-4 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 sm:text-sm resize-none"
              />
            </div>

            <div className="rounded-2xl bg-surface-secondary px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="recipe-simplicity" className="text-sm font-medium text-text-secondary">
                  Recipe simplicity
                </label>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-text">
                  {simplicity}/5
                </span>
              </div>
              <input
                id="recipe-simplicity"
                type="range"
                min={1}
                max={5}
                step={1}
                value={simplicity}
                onChange={(e) => setSimplicity(Number(e.target.value))}
                className="mt-3 w-full accent-accent"
              />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>Quick</span>
                <span>Ambitious</span>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {generating && (
              <div className="flex items-center justify-center gap-2 py-8 text-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Generating your recipe...</span>
              </div>
            )}

            <Button type="submit" disabled={!prompt.trim() || generating} className="w-full">
              {generating ? 'Generating...' : 'Generate Recipe'}
            </Button>
          </form>
        ) : (
          <div className="max-h-[calc(85vh-9rem)] space-y-4 overflow-y-auto pr-1">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-text">{generated.title}</h3>
                {sourceLinks.length > 0 && (
                  <div
                    aria-label={`${sourceLinks.length} sources searched`}
                    className="flex shrink-0 items-center rounded-full border border-border bg-surface-secondary px-2 py-1"
                  >
                    {visibleSourceLinks.map((source) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        title={source.host}
                        className="-ml-1 first:ml-0 flex h-7 w-7 items-center justify-center rounded-full border border-surface bg-surface shadow-soft transition hover:z-10 hover:-translate-y-0.5"
                      >
                        <img
                          src={source.faviconUrl}
                          alt=""
                          className="h-4 w-4"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <span className="sr-only">{source.host}</span>
                      </a>
                    ))}
                    {hiddenSourceCount > 0 && (
                      <span className="-ml-1 flex h-7 min-w-7 items-center justify-center rounded-full border border-surface bg-bg px-1.5 text-xs font-semibold text-text-secondary">
                        +{hiddenSourceCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {generated.description && (
                <p className="mt-1 text-sm text-text-secondary">{generated.description}</p>
              )}
            </div>

            {generated.ingredients.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-2">Ingredients</h4>
                <ul className="space-y-1">
                  {generated.ingredients.map((ing, i) => (
                    <li key={i} className="text-sm text-text-secondary">
                      {ing.quantity} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {generated.steps.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-2">Steps</h4>
                <ol className="space-y-2">
                  {generated.steps.map((s, i) => (
                    <li key={i} className="text-sm text-text-secondary">
                      <span className="font-medium text-text">{i + 1}.</span> {s.content}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {generated.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {generated.tags.map((tag) => (
                  <span key={tag} className="inline-flex rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-secondary">
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
