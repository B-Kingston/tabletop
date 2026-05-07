import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { useRecipe, useCreateRecipe, useUpdateRecipe } from '@/hooks/useRecipes'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DetailSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

interface IngredientRow {
  name: string
  quantity: string
  unit: string
  optional: boolean
}

interface StepRow {
  orderIndex: number
  title: string
  content: string
  durationMin: number | null
}

export function RecipeEdit() {
  const { instanceId, recipeId } = useParams({ strict: false }) as { instanceId: string; recipeId?: string }
  const navigate = useNavigate()
  const isNew = !recipeId || recipeId === 'new'
  const { data: existingRecipe, isLoading } = useRecipe(instanceId, !isNew ? recipeId! : '')
  const createRecipe = useCreateRecipe(instanceId)
  const updateRecipe = useUpdateRecipe(instanceId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [prepTime, setPrepTime] = useState(0)
  const [cookTime, setCookTime] = useState(0)
  const [servings, setServings] = useState(0)
  const [imageUrl, setImageUrl] = useState('')
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { name: '', quantity: '', unit: '', optional: false },
  ])
  const [steps, setSteps] = useState<StepRow[]>([{ orderIndex: 1, title: '', content: '', durationMin: null }])
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (existingRecipe) {
      setTitle(existingRecipe.title)
      setDescription(existingRecipe.description ?? '')
      setPrepTime(existingRecipe.prepTime ?? 0)
      setCookTime(existingRecipe.cookTime ?? 0)
      setServings(existingRecipe.servings ?? 0)
      setImageUrl(existingRecipe.imageUrl ?? '')
      setIngredients(
        existingRecipe.ingredients?.length
          ? existingRecipe.ingredients.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              unit: i.unit,
              optional: i.optional,
            }))
          : [{ name: '', quantity: '', unit: '', optional: false }]
      )
      setSteps(
        existingRecipe.steps?.length
          ? existingRecipe.steps.map((s, idx) => ({
              orderIndex: idx + 1,
              title: s.title ?? '',
              content: s.content,
              durationMin: s.durationMin,
            }))
          : [{ orderIndex: 1, title: '', content: '', durationMin: null }]
      )
      setTags(existingRecipe.tags?.map((t) => t.name) ?? [])
    }
  }, [existingRecipe])

  if (!isNew && isLoading) return <DetailSkeleton />

  function addIngredient() {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '', optional: false }])
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  function updateIngredient(index: number, field: keyof IngredientRow, value: string | boolean) {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  function addStep() {
    setSteps([...steps, { orderIndex: steps.length + 1, title: '', content: '', durationMin: null }])
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, orderIndex: i + 1 })))
  }

  function updateStep(index: number, field: keyof StepRow, value: string | number | null) {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    setSteps(updated)
  }

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const payload = {
      title,
      description: description || undefined,
      prepTime: prepTime || undefined,
      cookTime: cookTime || undefined,
      servings: servings || undefined,
      imageUrl: imageUrl || undefined,
      ingredients: ingredients.filter((i) => i.name.trim()).map((i) => ({
        name: i.name,
        quantity: i.quantity || undefined,
        unit: i.unit || undefined,
        optional: i.optional,
      })),
      steps: steps.filter((s) => s.content.trim()).map((s) => ({
        orderIndex: s.orderIndex,
        title: s.title || undefined,
        content: s.content,
        durationMin: s.durationMin,
      })),
      tags: tags.length > 0 ? tags : undefined,
    }

    if (isNew) {
      createRecipe.mutate(payload, {
        onSuccess: (recipe) =>
          navigate({
            to: '/instances/$instanceId/recipes/$recipeId',
            params: { instanceId, recipeId: recipe.id },
          }),
      })
    } else {
      updateRecipe.mutate(
        { ...payload, recipeId: recipeId! },
        {
          onSuccess: () =>
            navigate({
              to: '/instances/$instanceId/recipes/$recipeId',
              params: { instanceId, recipeId: recipeId! },
            }),
        }
      )
    }
  }

  const isPending = createRecipe.isPending || updateRecipe.isPending

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={() =>
            navigate(
              isNew
                ? { to: '/instances/$instanceId/recipes', params: { instanceId } }
                : { to: '/instances/$instanceId/recipes/$recipeId', params: { instanceId, recipeId: recipeId! } }
            )
          }
          className="mb-6 flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {isNew ? 'Back to Recipes' : 'Back to Recipe'}
        </button>

        <h1 className="text-2xl font-bold tracking-tight text-text mb-6">
          {isNew ? 'New Recipe' : 'Edit Recipe'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">
                Title
              </label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="block w-full rounded-2xl bg-surface-secondary border-0 py-2.5 px-4 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 sm:text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="prepTime" className="block text-sm font-medium text-text-secondary mb-1">
                  Prep (min)
                </label>
                <Input
                  id="prepTime"
                  type="number"
                  min={0}
                  value={prepTime || ''}
                  onChange={(e) => setPrepTime(Number(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="cookTime" className="block text-sm font-medium text-text-secondary mb-1">
                  Cook (min)
                </label>
                <Input
                  id="cookTime"
                  type="number"
                  min={0}
                  value={cookTime || ''}
                  onChange={(e) => setCookTime(Number(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="servings" className="block text-sm font-medium text-text-secondary mb-1">
                  Servings
                </label>
                <Input
                  id="servings"
                  type="number"
                  min={0}
                  value={servings || ''}
                  onChange={(e) => setServings(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-text-secondary mb-1">
                Image URL
              </label>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-text">Ingredients</h2>
              <Button type="button" variant="ghost" size="sm" onClick={addIngredient}>
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                    placeholder="Ingredient"
                    className="flex-1 rounded-2xl bg-surface-secondary border-0 py-2 px-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <input
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-20 rounded-2xl bg-surface-secondary border-0 py-2 px-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <input
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                    placeholder="Unit"
                    className="w-20 rounded-2xl bg-surface-secondary border-0 py-2 px-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <label className="flex items-center gap-1 text-xs text-muted whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={ing.optional}
                      onChange={(e) => updateIngredient(i, 'optional', e.target.checked)}
                      className="rounded border-border"
                    />
                    Opt.
                  </label>
                  {ingredients.length > 1 && (
                    <button type="button" onClick={() => removeIngredient(i)} className="text-muted hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-text">Steps</h2>
              <Button type="button" variant="ghost" size="sm" onClick={addStep}>
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="bg-surface-secondary rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted">Step {i + 1}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={step.durationMin ?? ''}
                        onChange={(e) => updateStep(i, 'durationMin', e.target.value ? Number(e.target.value) : null)}
                        placeholder="Min"
                        className="w-20 rounded-2xl bg-surface-secondary border-0 py-1.5 px-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                      {steps.length > 1 && (
                        <button type="button" onClick={() => removeStep(i)} className="text-muted hover:text-red-600">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    value={step.title}
                    onChange={(e) => updateStep(i, 'title', e.target.value)}
                    placeholder="Step title (optional)"
                    className="mb-2 w-full rounded-2xl bg-surface-secondary border-0 py-1.5 px-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <textarea
                    value={step.content}
                    onChange={(e) => updateStep(i, 'content', e.target.value)}
                    placeholder="Step instructions..."
                    rows={2}
                    className="w-full rounded-2xl bg-surface-secondary border-0 py-1.5 px-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text mb-3">Tags</h2>
            <div className="flex items-center gap-2 mb-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add a tag" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} />
              <Button type="button" variant="secondary" size="sm" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-muted hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={!title || isPending}>
              {isPending ? 'Saving...' : isNew ? 'Create Recipe' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                navigate(
                  isNew
                    ? { to: '/instances/$instanceId/recipes', params: { instanceId } }
                    : { to: '/instances/$instanceId/recipes/$recipeId', params: { instanceId, recipeId: recipeId! } }
                )
              }
            >
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </ErrorBoundary>
  )
}
