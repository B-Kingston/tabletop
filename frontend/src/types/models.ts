export interface User {
  id: string
  clerkId: string
  email: string
  name: string
  avatarUrl: string
  createdAt: string
  updatedAt: string
}

export interface Instance {
  id: string
  name: string
  description: string
  ownerId: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  owner?: User
  members?: User[]
}

export interface MediaItem {
  id: string
  instanceId: string
  tmdbId: number
  type: 'movie' | 'tv'
  title: string
  overview: string
  posterPath: string
  releaseDate: string | null
  planToWatchDate: string | null
  status: 'planning' | 'watching' | 'completed' | 'dropped'
  rating: number | null
  review: string
  createdById: string
  updatedById: string
  createdAt: string
  updatedAt: string
  createdBy?: User
}

export interface Recipe {
  id: string
  instanceId: string
  title: string
  description: string
  sourceUrl: string
  prepTime: number
  cookTime: number
  servings: number
  imageUrl: string
  rating: number | null
  review: string
  createdById: string
  updatedById: string
  createdAt: string
  updatedAt: string
  ingredients?: Ingredient[]
  steps?: RecipeStep[]
  tags?: RecipeTag[]
  createdBy?: User
}

export interface Ingredient {
  id: string
  recipeId: string
  name: string
  quantity: string
  unit: string
  cost: number | null
  optional: boolean
}

export interface RecipeStep {
  id: string
  recipeId: string
  orderIndex: number
  title: string
  content: string
  durationMin: number | null
}

export interface RecipeTag {
  id: string
  name: string
}

export interface Wine {
  id: string
  instanceId: string
  name: string
  type: 'red' | 'white' | 'rose' | 'sparkling' | 'port'
  cost: number | null
  rating: number | null
  notes: string
  consumedAt: string | null
  createdById: string
  updatedById: string
  createdAt: string
  updatedAt: string
  createdBy?: User
}

export interface ChatSession {
  id: string
  instanceId: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
  messages?: ChatMessage[]
  user?: User
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

export interface Night {
  id: string
  instanceId: string
  name: string
  wineId: string | null
  recipeId: string | null
  mediaId: string | null
  createdById: string
  updatedById: string
  createdAt: string
  updatedAt: string
  wine?: Wine | null
  recipe?: Recipe | null
  media?: MediaItem | null
  createdBy?: User
}

export interface TMDBSearchResult {
  id: number
  title?: string
  name?: string
  overview: string
  poster_path?: string
  release_date?: string
  first_air_date?: string
  media_type?: string
  vote_average: number
}

export interface TMDBMovieDetails {
  id: number
  title: string
  overview: string
  poster_path: string
  release_date: string
  runtime: number
  vote_average: number
  genres: { id: number; name: string }[]
}

export interface TMDBTVDetails {
  id: number
  name: string
  overview: string
  poster_path: string
  first_air_date: string
  number_of_episodes: number
  number_of_seasons: number
  vote_average: number
  genres: { id: number; name: string }[]
}
