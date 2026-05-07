import { ChefHat, Clock, Users } from 'lucide-react'

interface RecipeSuggestionCardProps {
  title: string
  description?: string
  prepTime?: number
  cookTime?: number
  servings?: number
  ingredients?: string[]
}

export function RecipeSuggestionCard({
  title,
  description,
  prepTime,
  cookTime,
  servings,
  ingredients,
}: RecipeSuggestionCardProps) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-accent-surface text-accent">
          <ChefHat className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-text">{title}</h4>
          {description && (
            <p className="mt-1 text-sm text-text-secondary line-clamp-2">{description}</p>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs text-muted">
            {(prepTime ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" strokeWidth={1.5} />
                {prepTime} min prep
              </span>
            )}
            {(cookTime ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" strokeWidth={1.5} />
                {cookTime} min cook
              </span>
            )}
            {(servings ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" strokeWidth={1.5} />
                {servings} servings
              </span>
            )}
          </div>

          {ingredients && ingredients.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {ingredients.slice(0, 5).map((ing, i) => (
                <span
                  key={i}
                  className="inline-flex rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-secondary"
                >
                  {ing}
                </span>
              ))}
              {ingredients.length > 5 && (
                <span className="text-xs text-muted">+{ingredients.length - 5} more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
