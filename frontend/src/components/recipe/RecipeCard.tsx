import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Clock, Users } from 'lucide-react'
import type { Recipe } from '@/types/models'

interface RecipeCardProps {
  recipe: Recipe
  instanceId: string
}

export function RecipeCard({ recipe, instanceId }: RecipeCardProps) {
  const navigate = useNavigate()

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() =>
        navigate({
          to: '/instances/$instanceId/recipes/$recipeId',
          params: { instanceId, recipeId: recipe.id },
        })
      }
      className="group text-left w-full rounded-xl bg-white shadow-sm ring-1 ring-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {recipe.imageUrl && (
        <div className="aspect-video w-full bg-neutral-100 overflow-hidden">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-medium text-neutral-900 truncate">{recipe.title}</h3>
        {recipe.description && (
          <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{recipe.description}</p>
        )}
        <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
          {(recipe.prepTime > 0 || recipe.cookTime > 0) && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {recipe.prepTime + recipe.cookTime} min
            </span>
          )}
          {recipe.servings > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {recipe.servings}
            </span>
          )}
        </div>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.button>
  )
}
