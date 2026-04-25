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
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <ChefHat className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-neutral-900">{title}</h4>
          {description && (
            <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{description}</p>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
            {(prepTime ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {prepTime} min prep
              </span>
            )}
            {(cookTime ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {cookTime} min cook
              </span>
            )}
            {(servings ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {servings} servings
              </span>
            )}
          </div>

          {ingredients && ingredients.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {ingredients.slice(0, 5).map((ing, i) => (
                <span
                  key={i}
                  className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
                >
                  {ing}
                </span>
              ))}
              {ingredients.length > 5 && (
                <span className="text-xs text-neutral-400">+{ingredients.length - 5} more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
