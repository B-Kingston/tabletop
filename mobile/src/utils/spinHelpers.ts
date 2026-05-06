import type { Wine, Recipe, MediaItem } from '@tabletop/shared'

/**
 * Select a random item from a non-empty array.
 */
export function selectRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

/**
 * Generate a night name by joining the selected item titles with " & ".
 * Truncates to 60 characters maximum.
 */
export function generateNightName(selections: {
  wine?: Wine
  recipe?: Recipe
  media?: MediaItem
}): string {
  const parts: string[] = []
  if (selections.wine) parts.push(selections.wine.name)
  if (selections.recipe) parts.push(selections.recipe.title)
  if (selections.media) parts.push(selections.media.title)

  if (parts.length === 0) return 'Mystery Night'

  let name = parts.join(' & ')
  if (name.length > 60) {
    name = name.substring(0, 57) + '...'
  }
  return name
}

/**
 * Check whether at least one selected category has items available.
 * Returns false when no categories are selected or all selected categories are empty.
 */
export function hasItemsInCategory(
  categories: Set<'wine' | 'recipe' | 'media'>,
  wines: Wine[],
  recipes: Recipe[],
  media: MediaItem[],
): boolean {
  if (categories.size === 0) return false
  return (
    (categories.has('wine') && wines.length > 0) ||
    (categories.has('recipe') && recipes.length > 0) ||
    (categories.has('media') && media.length > 0)
  )
}
