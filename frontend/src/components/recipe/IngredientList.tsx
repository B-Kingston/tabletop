import type { Ingredient } from '@/types/models'

interface IngredientListProps {
  ingredients: Ingredient[]
}

export function IngredientList({ ingredients }: IngredientListProps) {
  return (
    <ul className="space-y-2">
      {ingredients.map((ing) => (
        <li key={ing.id} className="flex items-center gap-3 text-sm">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border">
            <div className="h-2 w-2 rounded-full bg-transparent" />
          </span>
          <span className="text-text">
            {ing.quantity && <span className="font-medium">{ing.quantity} </span>}
            {ing.unit && <span className="text-text-secondary">{ing.unit} </span>}
            {ing.name}
          </span>
          {ing.optional && (
            <span className="text-xs text-muted">(optional)</span>
          )}
        </li>
      ))}
    </ul>
  )
}
