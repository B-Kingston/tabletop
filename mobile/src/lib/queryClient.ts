import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes (global default)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// ── Per-domain stale times ───────────────────────────────────────────────
// These override the global default for specific query key patterns.
// TanStack Query v5 matches the shortest prefix.

// Instances: 5 minutes (matches global default — explicit for clarity)
queryClient.setQueryDefaults(['instances'], {
  staleTime: 5 * 60 * 1000,
})

// Recipes, Wines, Media, Nights: 3 minutes
queryClient.setQueryDefaults(['recipes'], {
  staleTime: 3 * 60 * 1000,
})
queryClient.setQueryDefaults(['wines'], {
  staleTime: 3 * 60 * 1000,
})
queryClient.setQueryDefaults(['media'], {
  staleTime: 3 * 60 * 1000,
})
queryClient.setQueryDefaults(['nights'], {
  staleTime: 3 * 60 * 1000,
})

// Chat sessions: 1 minute
queryClient.setQueryDefaults(['chat-sessions'], {
  staleTime: 1 * 60 * 1000,
})

// Member messages: 0 seconds (always fresh, polling handles it)
queryClient.setQueryDefaults(['member-messages'], {
  staleTime: 0,
})

// OMDb search: 10 minutes (OMDb data changes infrequently)
queryClient.setQueryDefaults(['omdb-search'], {
  staleTime: 10 * 60 * 1000,
})
