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
  omdbId: string
  type: 'movie' | 'tv'
  title: string
  overview: string
  releaseYear: string
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

export interface MemberMessage {
  id: string
  instanceId: string
  userId: string
  content: string
  createdAt: string
  user?: User
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

export interface OMDBRating {
  source: string
  value: string
}

export interface OMDBDetail {
  title: string
  year: string
  rated: string
  released: string
  runtime: string
  genre: string
  director: string
  writer: string
  actors: string
  plot: string
  language: string
  country: string
  awards: string
  poster: string
  ratings: OMDBRating[]
  metascore: string
  imdbRating: string
  imdbVotes: string
  imdbId: string
  type: string
  boxOffice: string
  production: string
  totalSeasons: string
}

export interface OMDBSearchResult {
  omdbId: string
  title: string
  type: 'movie' | 'tv'
  releaseYear: string
}

export interface OMDBSearchResponse {
  page: number
  results: OMDBSearchResult[]
  totalResults: number
}
