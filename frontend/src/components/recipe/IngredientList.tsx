import type { Ingredient } from '@/types/models'

interface IngredientListProps {
  ingredients: Ingredient[]
}

export function IngredientList({ ingredients }: IngredientListProps) {
  return (
    <ul className="space-y-2">
      {ingredients.map((ing) => (
        <li key={ing.id} className="flex items-center gap-3 text-sm">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-neutral-300">
            <div className="h-2 w-2 rounded-full bg-transparent" />
          </span>
          <span className="text-neutral-900">
            {ing.quantity && <span className="font-medium">{ing.quantity} </span>}
            {ing.unit && <span className="text-neutral-500">{ing.unit} </span>}
            {ing.name}
          </span>
          {ing.optional && (
            <span className="text-xs text-neutral-400">(optional)</span>
          )}
        </li>
      ))}
    </ul>
  )
}
