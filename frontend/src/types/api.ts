export interface ApiResponse<T> {
  data: T
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  error: string | null
  page?: number
  totalPages?: number
}
